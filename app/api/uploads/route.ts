import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ensureUserIdFromSession } from '@/lib/user';

const schema = z.object({ blob_key: z.string(), filename: z.string(), columns: z.array(z.string()), row_count: z.number() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const { blob_key, filename, columns, row_count } = schema.parse(json);
  const upload = await prisma.uploads.create({ data: { user_id: userId, blob_key, filename, columns: columns as any, row_count } });
  return NextResponse.json({ upload });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uploads = await prisma.uploads.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
  return NextResponse.json({ uploads });
}


