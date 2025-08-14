import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const pageSize = 50;
  const where = {
    user_id: userId,
    ...(search ? { OR: [ { email: { contains: search, mode: 'insensitive' as const } }, { fields: { path: ['first_name'], string_contains: search } as any } ] } : {})
  };
  const [total, items] = await Promise.all([
    prisma.contacts.count({ where }),
    prisma.contacts.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })
  ]);
  return NextResponse.json({ total, page, pageSize, items });
}

const delSchema = z.object({ ids: z.array(z.string()).min(1) });

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const body = await req.json();
  const { ids } = delSchema.parse(body);

  // Try to delete contacts that have no campaign_recipients; for the rest, mark unsubscribed
  const attached = await prisma.campaign_recipients.findMany({ where: { contact_id: { in: ids } }, select: { contact_id: true } });
  const attachedSet = new Set(attached.map(a => a.contact_id));
  const deletable = ids.filter(id => !attachedSet.has(id));
  const toUnsub = ids.filter(id => attachedSet.has(id));

  let deleted = 0;
  if (deletable.length) {
    const res = await prisma.contacts.deleteMany({ where: { id: { in: deletable }, user_id: userId } });
    deleted = res.count;
  }
  let unsubscribed = 0;
  if (toUnsub.length) {
    const res = await prisma.contacts.updateMany({ where: { id: { in: toUnsub }, user_id: userId }, data: { unsubscribed: true } });
    unsubscribed = res.count;
  }
  return NextResponse.json({ deleted, unsubscribed });
}


