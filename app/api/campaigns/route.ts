import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  google_account_id: z.string(),
  template_id: z.string(),
  upload_id: z.string(),
  filters: z.any().default({})
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const items = await prisma.campaigns.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
  return NextResponse.json({ campaigns: items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const body = await req.json();
  const data = schema.parse(body);
  const created = await prisma.campaigns.create({
    data: {
      user_id: userId,
      name: data.name,
      google_account_id: data.google_account_id,
      template_id: data.template_id,
      upload_id: data.upload_id,
      filters: data.filters as any,
      status: 'draft'
    } as any
  });
  return NextResponse.json({ campaign: created });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  if (ids.length === 0) return NextResponse.json({ deleted: 0 });
  // Delete recipients first due to FK
  await prisma.campaign_recipients.deleteMany({ where: { campaign_id: { in: ids } } });
  const res = await prisma.campaigns.deleteMany({ where: { id: { in: ids }, user_id: userId } });
  return NextResponse.json({ deleted: res.count });
}


