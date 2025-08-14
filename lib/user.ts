import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

type SessionLike = { user?: { id?: string; email?: string | null } } | null;

export async function ensureUserIdFromSession(session: SessionLike): Promise<string> {
  const sessUser = (session as any)?.user;
  const sessionId = sessUser?.id as string | undefined;
  const sessionEmail = (sessUser?.email ?? null) as string | null;

  if (sessionId) {
    const exists = await prisma.users.findUnique({ where: { id: sessionId }, select: { id: true } });
    if (exists) return exists.id;
  }

  if (sessionEmail) {
    const byEmail = await prisma.users.findUnique({ where: { email: sessionEmail }, select: { id: true } });
    if (byEmail) return byEmail.id;
    // Auto-create user when authenticated via OAuth but app user missing
    const randomPass = await bcrypt.hash(`auto-${Date.now()}-${Math.random()}`, 10);
    const created = await prisma.users.create({ data: { email: sessionEmail, password_hash: randomPass, email_verified_at: new Date() } });
    return created.id;
  }

  throw new Error('Unauthorized');
}




