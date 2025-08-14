import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';

export async function POST(_: Request, { params }: { params: { token: string } }) {
  const t = verifyUnsubscribeToken(params.token);
  if (!t) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  const contact = await prisma.contacts.findFirst({ where: { id: t.contactId, user_id: t.userId } });
  if (!contact) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  await prisma.contacts.update({ where: { id: contact.id }, data: { unsubscribed: true } });
  return NextResponse.json({ ok: true });
}


