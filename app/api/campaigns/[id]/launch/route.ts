import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { kv } from '@/lib/kv';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const campaign = await prisma.campaigns.findFirst({ where: { id: params.id, user_id: userId } });
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (campaign.status !== 'draft' && campaign.status !== 'paused') return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  // Create recipients from upload contacts if not exists
  const existingCount = await prisma.campaign_recipients.count({ where: { campaign_id: campaign.id } });
  if (existingCount === 0) {
    const contacts = await prisma.contacts.findMany({ where: { user_id: userId, upload_id: campaign.upload_id, unsubscribed: false }, select: { id: true } });
    for (let i = 0; i < contacts.length; i += 500) {
      const chunk = contacts.slice(i, i + 500);
      await prisma.campaign_recipients.createMany({ data: chunk.map(c => ({ campaign_id: campaign.id, contact_id: c.id })) });
    }
  }

  await prisma.campaigns.update({ where: { id: campaign.id }, data: { status: 'running', started_at: new Date() } });
  await kv.set(`camp:${campaign.id}:cursor`, { lastId: null });
  return NextResponse.json({ ok: true });
}


