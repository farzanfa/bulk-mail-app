import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, createOAuthClient } from '@/lib/gmail';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { canConnectGmailAccount } from '@/lib/plan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    // start oauth exchange

    const tokens = await exchangeCodeForTokens(code);
    // tokens received (redacted)
    const oauth2 = createOAuthClient();
    oauth2.setCredentials(tokens);
    const oauth2api = google.oauth2({ version: 'v2', auth: oauth2 });
    const me = await oauth2api.userinfo.get();
    const email = me.data.email as string;
    const google_user_id = me.data.id as string;
    const google_name = me.data.name as string | undefined;
    const google_picture = me.data.picture as string | undefined;
    // fetched userinfo

    // Determine the app user to link: prefer session user; otherwise by email
    const session = await getServerSession(authOptions);
    let userId: string | null = (session as any)?.user?.id ?? null;
    // If session user id provided, ensure it exists; otherwise try by email; otherwise auto-create
    if (userId) {
      const exists = await prisma.users.findUnique({ where: { id: userId }, select: { id: true } });
      if (!exists) userId = null;
    }
    if (!userId && email) {
      const byEmail = await prisma.users.findUnique({ where: { email }, select: { id: true } });
      if (byEmail) userId = byEmail.id;
    }
    if (!userId && email) {
      // Auto-create a user to attach this Google account
      const randomPass = await bcrypt.hash(`google-link-${Date.now()}-${Math.random()}`, 10);
      const created = await prisma.users.create({ data: { email, password_hash: randomPass, email_verified_at: new Date() } });
      userId = created.id;
    }
    // resolved userId
    if (!userId) {
      return NextResponse.json({ error: 'No authenticated user to link this Google account' }, { status: 401 });
    }

    // Check if user can connect another Gmail account based on their plan
    const canConnect = await canConnectGmailAccount(userId);
    if (!canConnect) {
      return NextResponse.json({ 
        error: 'Account limit reached. Free, Beta, and Pro users can only connect one Gmail account. Contact support for multiple accounts.' 
      }, { status: 403 });
    }

    const refresh = tokens.refresh_token;
    if (!refresh) return NextResponse.json({ error: 'No refresh token (ensure prompt=consent)' }, { status: 400 });
    // upserting google account
    await prisma.google_accounts.upsert({
      where: { user_id_google_user_id: { user_id: userId, google_user_id } },
      update: {
        email,
        google_name: google_name || null,
        google_picture: google_picture || null,
        refresh_token_encrypted: encrypt(refresh),
        access_token: tokens.access_token || null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      },
      create: {
        user_id: userId,
        email,
        google_user_id,
        google_name: google_name || null,
        google_picture: google_picture || null,
        refresh_token_encrypted: encrypt(refresh),
        access_token: tokens.access_token || null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });
    // success
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (err: any) {
    console.error('oauth: error', err?.message || err);
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
  }
}


