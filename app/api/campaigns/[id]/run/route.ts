import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const campaign = await prisma.campaigns.findFirst({ where: { id: params.id, user_id: userId } });
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET not set' }, { status: 500 });
  const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const url = `${base}/api/jobs/send?campaignId=${campaign.id}&token=${encodeURIComponent(process.env.CRON_SECRET)}`;
  await fetch(url, { method: 'POST' });
  return NextResponse.json({ ok: true });
}


