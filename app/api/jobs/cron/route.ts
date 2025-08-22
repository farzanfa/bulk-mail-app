import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const authHeader = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (
    !process.env.CRON_SECRET ||
    (token !== process.env.CRON_SECRET && authHeader !== expected)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check for scheduled campaigns that should be started
  const now = new Date();
  const scheduledToStart = await prisma.campaigns.findMany({
    where: {
      status: 'scheduled',
      scheduled_at: {
        lte: now
      }
    }
  });
  
  // Start scheduled campaigns
  for (const campaign of scheduledToStart) {
    await prisma.campaigns.update({
      where: { id: campaign.id },
      data: {
        status: 'running',
        started_at: now
      }
    });
  }
  
  // Find running campaigns and trigger background send
  const running = await prisma.campaigns.findMany({ where: { status: 'running' } });
  // In Vercel, we would enqueue background functions here; simplified: call worker route per campaign
  const calls = await Promise.allSettled(
    running.map(async (c) => {
      const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/send?campaignId=${c.id}&token=${encodeURIComponent(process.env.CRON_SECRET as string)}`;
      await fetch(url, { method: 'POST' });
    })
  );
  const ok = calls.filter(c => c.status === 'fulfilled').length;
  return NextResponse.json({ 
    ok, 
    total: running.length,
    scheduled_started: scheduledToStart.length 
  });
}


