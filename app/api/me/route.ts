import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserPlan } from '@/lib/plan';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session as any).user.id as string;
  const [user, google, plan] = await Promise.all([
    prisma.users.findUnique({ where: { id: userId }, select: { id: true, email: true, email_verified_at: true, full_name: true, company: true, website: true, role: true, purpose: true, phone: true, onboarding_completed_at: true } }),
    prisma.google_accounts.findMany({ where: { user_id: userId }, select: { id: true, email: true } }),
    getUserPlan(userId)
  ]);
  
  return NextResponse.json({ 
    user: { ...user, plan }, 
    googleAccounts: google 
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session as any).user.id as string;
  
  // Check if user exists before attempting update
  const userExists = await prisma.users.findUnique({ 
    where: { id: userId },
    select: { id: true }
  });
  
  if (!userExists) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  for (const k of ['full_name','company','website','role','purpose','phone'] as const) {
    if (typeof (body as any)[k] === 'string') (data as any)[k] = (body as any)[k];
  }
  if ((body as any).onboarding_completed === true) (data as any).onboarding_completed_at = new Date();
  
  try {
    await prisma.users.update({ where: { id: userId }, data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}


