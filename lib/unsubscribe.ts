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

export function appendUnsubscribeFooter(html: string, link: string, customBranding: boolean = false): string {
  let footer: string;
  
  if (customBranding) {
    // Custom branding: minimal footer without platform branding
    footer = `<div style="margin-top:24px;font-size:12px;color:#6b7280;text-align:center"><a href="${link}" style="color:#6b7280;text-decoration:underline">Unsubscribe</a></div>`;
  } else {
    // Default footer with platform branding - but this will be handled by the email template
    footer = `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center">
      <p style="margin:0">If you no longer wish to receive emails, you can <a href="${link}" style="color:#6b7280;text-decoration:underline">unsubscribe here</a>.</p>
    </div>`;
  }
  
  // Try to insert before the main content closing TD tag
  if (/<\/td>\s*<\/tr>\s*<!--\s*Footer\s*-->/i.test(html)) {
    return html.replace(/<\/td>(\s*<\/tr>\s*<!--\s*Footer\s*-->)/i, `${footer}</td>$1`);
  }
  // Fallback to inserting before </body>
  else if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  // If no body tag, just append
  return html + footer;
}


