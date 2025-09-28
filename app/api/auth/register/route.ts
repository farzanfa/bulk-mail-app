import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { email, password } = schema.parse(json);
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({ data: { email, password_hash } });
    const token = randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.email_verifications.create({ data: { user_id: user.id, token, expires_at } });
    // TODO: send verification email via Gmail after Google linked, or fallback provider
    return NextResponse.json({ ok: true, verify_token: token });
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


