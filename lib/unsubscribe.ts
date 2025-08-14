import crypto from 'node:crypto';

const HMAC_KEY = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY || 'changeme';

export function createUnsubscribeToken(userId: string, contactId: string): string {
  const base = `${userId}:${contactId}`;
  const sig = crypto.createHmac('sha256', HMAC_KEY).update(base).digest('base64url');
  return `${base}:${sig}`;
}

export function verifyUnsubscribeToken(token: string): { userId: string; contactId: string } | null {
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [userId, contactId, sig] = parts;
  const base = `${userId}:${contactId}`;
  const expected = crypto.createHmac('sha256', HMAC_KEY).update(base).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return { userId, contactId };
}

export function appendUnsubscribeFooter(html: string, link: string): string {
  const footer = `<div style="margin-top:24px;font-size:12px;color:#6b7280">If you no longer wish to receive emails, you can <a href="${link}">unsubscribe here</a>.</div>`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${footer}</body>`);
  return html + footer;
}


