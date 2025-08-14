import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractVariables } from '@/lib/render';

const createSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  html: z.string().default(''),
  text: z.string().optional().default('')
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const templates = await prisma.templates.findMany({ where: { user_id: userId }, orderBy: { updated_at: 'desc' } });
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const body = await req.json();
  const { name, subject, html, text } = createSchema.parse(body);
  const variables = Array.from(new Set([...extractVariables(subject), ...extractVariables(html), ...extractVariables(text || '')]));
  const created = await prisma.templates.create({ data: { user_id: userId, name, subject, html, text, variables: variables as any } });
  return NextResponse.json({ template: created });
}


