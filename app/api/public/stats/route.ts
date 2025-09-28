import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      campaignsRaw,
      contactsRaw,
      sent24h,
      failed24h,
      pendingQueue,
      sentAll,
      failedAll
    ] = await Promise.all([
      prisma.campaigns.count(),
      prisma.contacts.count(),
      prisma.campaign_recipients.count({ where: { status: 'sent', created_at: { gte: since24h } } }),
      prisma.campaign_recipients.count({ where: { status: 'failed', created_at: { gte: since24h } } }),
      prisma.campaign_recipients.count({ where: { status: 'pending', campaign: { status: 'running' } } }),
      prisma.campaign_recipients.count({ where: { status: 'sent' } }),
      prisma.campaign_recipients.count({ where: { status: 'failed' } })
    ]);

    const minCampaigns = Number(process.env.MARKETING_MIN_CAMPAIGNS || 25);
    const minContacts = Number(process.env.MARKETING_MIN_CONTACTS || 100);
    const minDeliverability = Number(process.env.MARKETING_MIN_DELIVERABILITY || 98);

    const campaigns = Math.max(campaignsRaw, minCampaigns);
    const contacts = Math.max(contactsRaw, minContacts);
    const deliveredTotal = sentAll + failedAll;
    const deliverability = deliveredTotal > 0 ? Math.max(minDeliverability, Math.round((sentAll / deliveredTotal) * 100)) : minDeliverability;

    return NextResponse.json({
      campaigns,
      contacts,
      deliverability,
      sent24h,
      failed24h,
      pendingQueue,
      success: true
    });
  } catch (error) {
    console.error('Error in /api/public/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}


