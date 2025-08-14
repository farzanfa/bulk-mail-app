import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Find running campaigns and trigger background send
  const running = await prisma.campaigns.findMany({ where: { status: 'running' } });
  // In Vercel, we would enqueue background functions here; simplified: call worker route per campaign
  const calls = await Promise.allSettled(
    running.map(async (c) => {
      const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/send?campaignId=${c.id}`;
      await fetch(url, { method: 'POST' });
    })
  );
  const ok = calls.filter(c => c.status === 'fulfilled').length;
  return NextResponse.json({ ok, total: running.length });
}


