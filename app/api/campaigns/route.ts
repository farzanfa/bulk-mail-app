import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getPlanLimits } from '@/lib/plan';
import { getCurrentMonthEmailUsage } from '@/lib/email-usage';

const schema = z.object({
  name: z.string().min(1),
  google_account_id: z.string(),
  template_id: z.string(),
  upload_id: z.string(),
  filters: z.any().default({}),
  scheduled_at: z.string().datetime().optional()
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  
  const items = await prisma.campaigns.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
  
  // Get plan limits and usage
  const planLimits = await getPlanLimits(userId);
  const campaignCount = items.length;
  const emailUsage = await getCurrentMonthEmailUsage(userId);
  
  return NextResponse.json({ 
    campaigns: items,
    limits: {
      campaigns: {
        used: campaignCount,
        total: planLimits.maxCampaigns,
        remaining: planLimits.maxCampaigns === -1 ? -1 : Math.max(0, planLimits.maxCampaigns - campaignCount)
      },
      emails: {
        used: emailUsage.used,
        total: emailUsage.limit,
        remaining: emailUsage.remaining
      }
    }
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  
  // Check campaign limits
  const planLimits = await getPlanLimits(userId);
  if (planLimits.maxCampaigns !== -1) {
    const campaignCount = await prisma.campaigns.count({ where: { user_id: userId } });
    if (campaignCount >= planLimits.maxCampaigns) {
      return NextResponse.json({ 
        error: `Campaign limit reached. Your plan allows ${planLimits.maxCampaigns} campaigns.`,
        upgradeRequired: true 
      }, { status: 402 });
    }
  }
  
  const body = await req.json();
  const data = schema.parse(body);
  
  // Determine initial status based on scheduling
  const status = data.scheduled_at ? 'scheduled' : 'draft';
  const scheduled_at = data.scheduled_at ? new Date(data.scheduled_at) : null;
  
  const created = await prisma.campaigns.create({
    data: {
      user_id: userId,
      name: data.name,
      google_account_id: data.google_account_id,
      template_id: data.template_id,
      upload_id: data.upload_id,
      filters: data.filters as any,
      status: status,
      scheduled_at: scheduled_at
    } as any
  });
  return NextResponse.json({ campaign: created });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  if (ids.length === 0) return NextResponse.json({ deleted: 0 });
  // Delete recipients first due to FK
  await prisma.campaign_recipients.deleteMany({ where: { campaign_id: { in: ids } } });
  const res = await prisma.campaigns.deleteMany({ where: { id: { in: ids }, user_id: userId } });
  return NextResponse.json({ deleted: res.count });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  
  const body = await req.json();
  const { id, scheduled_at } = body;
  
  if (!id) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
  
  // Verify campaign ownership
  const campaign = await prisma.campaigns.findFirst({
    where: { id, user_id: userId }
  });
  
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  
  // Only allow scheduling for campaigns in draft or scheduled status
  if (!['draft', 'scheduled'].includes(campaign.status)) {
    return NextResponse.json({ 
      error: 'Can only schedule campaigns that are in draft or scheduled status' 
    }, { status: 400 });
  }
  
  const updateData: any = {};
  
  if (scheduled_at === null) {
    // Remove scheduling
    updateData.scheduled_at = null;
    updateData.status = 'draft';
  } else if (scheduled_at) {
    // Update scheduling
    updateData.scheduled_at = new Date(scheduled_at);
    updateData.status = 'scheduled';
  }
  
  const updated = await prisma.campaigns.update({
    where: { id },
    data: updateData
  });
  
  return NextResponse.json({ campaign: updated });
}


