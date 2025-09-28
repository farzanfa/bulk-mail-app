import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits } from '@/lib/plan';
import { ensureUserIdFromSession } from '@/lib/user';
import { z } from 'zod';
import crypto from 'crypto';

// GET /api/team - List team members
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Get team members where user is owner
  const teamMembers = await prisma.team_members.findMany({
    where: { team_owner_id: userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          full_name: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });
  
  // Get teams where user is a member
  const memberOf = await prisma.team_members.findMany({
    where: { user_id: userId, team_owner_id: { not: userId } },
    include: {
      team_owner: {
        select: {
          id: true,
          email: true,
          full_name: true
        }
      }
    }
  });
  
  // Get plan limits
  const planLimits = await getPlanLimits(userId);
  
  return NextResponse.json({
    team: {
      members: teamMembers.map(m => ({
        id: m.id,
        user: m.user,
        role: m.role,
        invited_at: m.invited_at,
        accepted_at: m.accepted_at,
        pending: !m.accepted_at
      })),
      memberOf: memberOf.map(m => ({
        id: m.id,
        owner: m.team_owner,
        role: m.role,
        joined_at: m.accepted_at
      }))
    },
    limits: {
      maxMembers: planLimits.teamMembers,
      currentMembers: teamMembers.filter(m => m.accepted_at).length + 1, // +1 for owner
      canAddMore: planLimits.teamMembers === -1 || teamMembers.filter(m => m.accepted_at).length + 1 < planLimits.teamMembers
    }
  });
}

// POST /api/team - Invite a team member
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member')
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const body = await req.json();
  const { email, role } = inviteSchema.parse(body);
  
  // Check plan limits
  const planLimits = await getPlanLimits(userId);
  if (planLimits.teamMembers !== -1) {
    const currentMembers = await prisma.team_members.count({
      where: { team_owner_id: userId, accepted_at: { not: null } }
    });
    
    if (currentMembers + 1 >= planLimits.teamMembers) {
      return NextResponse.json({
        error: `Team member limit reached. Your plan allows ${planLimits.teamMembers} team members.`,
        upgradeRequired: true
      }, { status: 402 });
    }
  }
  
  // Check if user exists
  const invitedUser = await prisma.users.findUnique({
    where: { email },
    select: { id: true }
  });
  
  if (!invitedUser) {
    return NextResponse.json({ 
      error: 'User not found. They must sign up first.' 
    }, { status: 404 });
  }
  
  // Check if already a team member
  const existing = await prisma.team_members.findUnique({
    where: {
      team_owner_id_user_id: {
        team_owner_id: userId,
        user_id: invitedUser.id
      }
    }
  });
  
  if (existing) {
    return NextResponse.json({ 
      error: 'User is already a team member' 
    }, { status: 400 });
  }
  
  // Create team member invitation using Web Crypto API
  const inviteBytes = new Uint8Array(32);
  crypto.getRandomValues(inviteBytes);
  const inviteToken = Buffer.from(inviteBytes).toString('base64url');
  const teamMember = await prisma.team_members.create({
    data: {
      team_owner_id: userId,
      user_id: invitedUser.id,
      role: role as any,
      invite_token: inviteToken
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          full_name: true
        }
      }
    }
  });
  
  // TODO: Send invitation email
  
  return NextResponse.json({
    teamMember: {
      id: teamMember.id,
      user: teamMember.user,
      role: teamMember.role,
      invited_at: teamMember.invited_at,
      pending: true
    }
  });
}

// DELETE /api/team/[id] - Remove a team member
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get('id');
  
  if (!memberId) {
    return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
  }
  
  // Verify ownership
  const member = await prisma.team_members.findFirst({
    where: {
      id: memberId,
      team_owner_id: userId
    }
  });
  
  if (!member) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
  }
  
  await prisma.team_members.delete({
    where: { id: memberId }
  });
  
  return NextResponse.json({ success: true });
}