import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const pageSize = 50;
  const where = {
    user_id: userId,
    upload_id: params.id,
    email: { contains: search, mode: 'insensitive' as const }
  };
  const [total, items] = await Promise.all([
    prisma.contacts.count({ where }),
    prisma.contacts.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })
  ]);
  return NextResponse.json({ total, page, pageSize, items });
}


