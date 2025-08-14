import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (process.env.E2E_ENABLE !== '1') return NextResponse.json({ error: 'Not enabled' }, { status: 404 });
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const body = await req.json().catch(() => ({}));
  const email = body.email || 'test-google@example.com';
  const google_user_id = body.google_user_id || 'test-google-uid';
  const refresh = body.refresh_token || 'mock-refresh-token';
  await prisma.google_accounts.upsert({
    where: { user_id_google_user_id: { user_id: userId, google_user_id } },
    update: { email },
    create: {
      user_id: userId,
      email,
      google_user_id,
      refresh_token_encrypted: encrypt(refresh)
    }
  });
  return NextResponse.json({ ok: true });
}



