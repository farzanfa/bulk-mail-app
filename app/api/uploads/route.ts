import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ensureUserIdFromSession } from '@/lib/user';
import { getUserPlan, FREE_LIMITS } from '@/lib/plan';

const schema = z.object({ blob_key: z.string(), filename: z.string(), columns: z.array(z.string()).default([]), row_count: z.number().default(0) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const plan = await getUserPlan(userId);
  if (plan === 'free') {
    const count = await prisma.uploads.count({ where: { user_id: userId } });
    if (count >= FREE_LIMITS.maxUploads) return NextResponse.json({ error: 'Free plan limit: 2 uploads' }, { status: 402 });
  }
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

const delSchema = z.object({ ids: z.array(z.string()).min(1) });

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const { ids } = delSchema.parse(body || {});

  // Delete in correct order to avoid foreign key constraints:
  // 1. First delete campaign recipients that reference contacts from these uploads
  await prisma.campaign_recipients.deleteMany({ 
    where: { 
      contact: { 
        upload_id: { in: ids }, 
        user_id: userId 
      } 
    } 
  });
  
  // 2. Then delete campaigns that reference these uploads
  await prisma.campaigns.deleteMany({ 
    where: { 
      upload_id: { in: ids }, 
      user_id: userId 
    } 
  });
  
  // 3. Then delete contacts belonging to these uploads and user
  await prisma.contacts.deleteMany({ 
    where: { 
      upload_id: { in: ids }, 
      user_id: userId 
    } 
  });
  
  // 4. Finally delete uploads rows
  const result = await prisma.uploads.deleteMany({ 
    where: { 
      id: { in: ids }, 
      user_id: userId 
    } 
  });
  
  return NextResponse.json({ deleted: result.count });
}


