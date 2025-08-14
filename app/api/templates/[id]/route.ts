import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractVariables } from '@/lib/render';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  html: z.string().optional(),
  text: z.string().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const t = await prisma.templates.findFirst({ where: { id: params.id, user_id: userId } });
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ template: t });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const body = await req.json();
  const data = updateSchema.parse(body);
  const existing = await prisma.templates.findFirst({ where: { id: params.id, user_id: userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const subject = data.subject ?? existing.subject;
  const html = data.html ?? existing.html;
  const text = data.text ?? existing.text;
  const variables = Array.from(new Set([...extractVariables(subject), ...extractVariables(html), ...extractVariables(text)]));
  const updated = await prisma.templates.update({
    where: { id: existing.id },
    data: {
      name: data.name ?? existing.name,
      subject,
      html,
      text,
      variables: variables as any,
      version: existing.version + 1
    }
  });
  return NextResponse.json({ template: updated });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const existing = await prisma.templates.findFirst({ where: { id: params.id, user_id: userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.templates.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}


