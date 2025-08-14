import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({ token: z.string().min(16) });

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { token } = schema.parse(json);
    const rec = await prisma.email_verifications.findUnique({ where: { token } });
    if (!rec || rec.expires_at < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.users.update({ where: { id: rec.user_id }, data: { email_verified_at: new Date() } }),
      prisma.email_verifications.delete({ where: { token } })
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


