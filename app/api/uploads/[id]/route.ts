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
  // Count contacts attached to this upload for display consistency
  const count = await prisma.contacts.count({ where: { upload_id: upload.id } });
  return NextResponse.json({ upload: { ...upload, row_count: count } });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  
  const upload = await prisma.uploads.findFirst({ where: { id: params.id, user_id: userId } });
  if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  // Delete the upload - database will handle cascading deletes automatically
  await prisma.uploads.delete({ where: { id: upload.id } });
  
  return NextResponse.json({ ok: true });
}


