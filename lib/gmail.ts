import { google } from 'googleapis';
import { decrypt } from './crypto';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

export function createOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID as string;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI as string;
  if (!clientId || !clientSecret || !redirectUri) throw new Error('Missing Google OAuth env');
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(state?: string) {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [GMAIL_SCOPE],
    prompt: 'consent',
    include_granted_scopes: true,
    state
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function buildRawMessage({ to, from, subject, html, text }: { to: string; from: string; subject: string; html?: string; text?: string; }): string {
  const boundary = 'mixed_boundary_' + Math.random().toString(36).slice(2);
  const headers = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ].join('\r\n');
  const parts: string[] = [];
  if (text) {
    parts.push([
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      text
    ].join('\r\n'));
  }
  if (html) {
    parts.push([
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html
    ].join('\r\n'));
  }
  parts.push(`--${boundary}--`);
  const raw = headers + '\r\n\r\n' + parts.join('\r\n');
  return Buffer.from(raw).toString('base64url');
}

export async function sendGmailMessage(args: {
  refreshTokenEncrypted: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  if (process.env.MOCK_GMAIL === '1') {
    return 'mock-' + Math.random().toString(36).slice(2);
  }
  const oauth2Client = createOAuthClient();
  const refreshToken = decrypt(args.refreshTokenEncrypted);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const raw = buildRawMessage({ to: args.toEmail, from: args.fromEmail, subject: args.subject, html: args.html, text: args.text });
  const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  return res.data.id || null;
}


