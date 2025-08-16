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
  
  // Delete in correct order to avoid foreign key constraints:
  // 1. First delete campaign recipients that reference contacts from this upload
  await prisma.campaign_recipients.deleteMany({ 
    where: { 
      contact: { 
        upload_id: upload.id, 
        user_id: userId 
      } 
    } 
  });
  
  // 2. Then delete campaigns that reference this upload
  await prisma.campaigns.deleteMany({ 
    where: { 
      upload_id: upload.id, 
      user_id: userId 
    } 
  });
  
  // 3. Then delete contacts belonging to this upload
  await prisma.contacts.deleteMany({ 
    where: { 
      upload_id: upload.id, 
      user_id: userId 
    } 
  });
  
  // 4. Finally delete the upload
  await prisma.uploads.delete({ where: { id: upload.id } });
  
  return NextResponse.json({ ok: true });
}


