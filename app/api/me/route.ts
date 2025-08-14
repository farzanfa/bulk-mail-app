import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session as any).user.id as string;
  const [user, google] = await Promise.all([
    prisma.users.findUnique({ where: { id: userId }, select: { id: true, email: true, email_verified_at: true } }),
    prisma.google_accounts.findMany({ where: { user_id: userId }, select: { id: true, email: true } })
  ]);
  return NextResponse.json({ user, googleAccounts: google });
}


