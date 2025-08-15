import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    campaigns,
    contacts,
    sent24h,
    failed24h,
    pendingQueue
  ] = await Promise.all([
    prisma.campaigns.count(),
    prisma.contacts.count(),
    prisma.campaign_recipients.count({ where: { status: 'sent', created_at: { gte: since24h } } }),
    prisma.campaign_recipients.count({ where: { status: 'failed', created_at: { gte: since24h } } }),
    prisma.campaign_recipients.count({ where: { status: 'pending', campaign: { status: 'running' } } })
  ]);
  return NextResponse.json({ campaigns, contacts, sent24h, failed24h, pendingQueue });
}


