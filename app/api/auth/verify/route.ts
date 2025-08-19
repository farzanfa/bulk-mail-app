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
    
    // Check if user exists before attempting to update
    const userExists = await prisma.users.findUnique({ 
      where: { id: rec.user_id },
      select: { id: true }
    });
    
    if (!userExists) {
      // Clean up the orphaned verification record
      await prisma.email_verifications.delete({ where: { token } });
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }
    
    await prisma.$transaction([
      prisma.users.update({ where: { id: rec.user_id }, data: { email_verified_at: new Date() } }),
      prisma.email_verifications.delete({ where: { token } })
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Error verifying email:', e);
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


