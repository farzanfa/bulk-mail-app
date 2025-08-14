import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, createOAuthClient } from '@/lib/gmail';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { google } from 'googleapis';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) return NextResponse.json({ error: 'Missing code/state' }, { status: 400 });
  const tokens = await exchangeCodeForTokens(code);
  const oauth2 = createOAuthClient();
  oauth2.setCredentials(tokens);
  const oauth2api = google.oauth2({ version: 'v2', auth: oauth2 });
  const me = await oauth2api.userinfo.get();
  const email = me.data.email as string;
  const google_user_id = me.data.id as string;
  const user_id = state;
  const refresh = tokens.refresh_token;
  if (!refresh) return NextResponse.json({ error: 'No refresh token (ensure prompt=consent)' }, { status: 400 });
  await prisma.google_accounts.upsert({
    where: { user_id_google_user_id: { user_id, google_user_id } },
    update: {
      email,
      refresh_token_encrypted: encrypt(refresh),
      access_token: tokens.access_token || null,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    },
    create: {
      user_id,
      email,
      google_user_id,
      refresh_token_encrypted: encrypt(refresh),
      access_token: tokens.access_token || null,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    }
  });
  return NextResponse.redirect(new URL('/dashboard', req.url));
}


