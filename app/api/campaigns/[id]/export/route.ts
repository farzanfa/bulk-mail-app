import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const camp = await prisma.campaigns.findFirst({ where: { id: params.id, user_id: userId } });
  if (!camp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const rec = await prisma.campaign_recipients.findMany({ where: { campaign_id: camp.id }, orderBy: { created_at: 'asc' } });
  const rows = [
    ['contact_id', 'status', 'gmail_message_id', 'error', 'attempts', 'last_attempt_at'],
    ...rec.map(r => [r.contact_id, r.status, r.gmail_message_id || '', (r.error || '').replace(/\n/g, ' '), String(r.attempts), r.last_attempt_at ? r.last_attempt_at.toISOString() : ''])
  ];
  const csv = rows.map(r => r.map(field => {
    const s = String(field);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="campaign_${camp.id}_recipients.csv"`
    }
  });
}


