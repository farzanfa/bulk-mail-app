import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { renderTemplateString } from '@/lib/render';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  template_id: z.string(),
  upload_id: z.string(),
  limit: z.number().int().min(1).max(20).default(10)
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const body = await req.json();
  const { template_id, upload_id, limit } = schema.parse(body);
  const [template] = await Promise.all([
    prisma.templates.findFirst({ where: { id: template_id, user_id: userId } })
  ]);
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  const contacts = await prisma.contacts.findMany({ where: { user_id: userId, upload_id }, take: limit });
  const renders = contacts.map((c) => ({
    contact_id: c.id,
    email: c.email,
    subject: renderTemplateString(template.subject, c.fields as any),
    html: renderTemplateString(template.html, c.fields as any),
    text: renderTemplateString(template.text, c.fields as any)
  }));
  return NextResponse.json({ renders });
}




