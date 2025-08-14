import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const upload = await prisma.uploads.findFirst({ where: { id: params.id, user_id: userId } });
  if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ upload });
}


