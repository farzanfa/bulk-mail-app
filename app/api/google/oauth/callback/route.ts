import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, createOAuthClient } from '@/lib/gmail';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const tokens = await exchangeCodeForTokens(code);
    const oauth2 = createOAuthClient();
    oauth2.setCredentials(tokens);
    const oauth2api = google.oauth2({ version: 'v2', auth: oauth2 });
    const me = await oauth2api.userinfo.get();
    const email = me.data.email as string;
    const google_user_id = me.data.id as string;

    // Determine the app user to link: prefer session user; otherwise by email
    const session = await getServerSession(authOptions);
    let userId: string | null = (session as any)?.user?.id ?? null;
    if (!userId && email) {
      const existingUser = await prisma.users.findUnique({ where: { email }, select: { id: true } });
      userId = existingUser?.id ?? null;
    }
    if (!userId) {
      return NextResponse.json({ error: 'No authenticated user to link this Google account' }, { status: 401 });
    }

    const refresh = tokens.refresh_token;
    if (!refresh) return NextResponse.json({ error: 'No refresh token (ensure prompt=consent)' }, { status: 400 });

    await prisma.google_accounts.upsert({
      where: { user_id_google_user_id: { user_id: userId, google_user_id } },
      update: {
        email,
        refresh_token_encrypted: encrypt(refresh),
        access_token: tokens.access_token || null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      },
      create: {
        user_id: userId,
        email,
        google_user_id,
        refresh_token_encrypted: encrypt(refresh),
        access_token: tokens.access_token || null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (err: any) {
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
  }
}


