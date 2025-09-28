const HMAC_KEY = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY || 'changeme';

// Helper function to create HMAC using Web Crypto API
async function createHMAC(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return btoa(String.fromCharCode(...hashArray));
}

// Helper function to verify HMAC using Web Crypto API
async function verifyHMAC(data: string, key: string, signature: string): Promise<boolean> {
  const expectedSignature = await createHMAC(data, key);
  return signature === expectedSignature;
}

export async function createUnsubscribeToken(userId: string, contactId: string): Promise<string> {
  const base = `${userId}:${contactId}`;
  const sig = await createHMAC(base, HMAC_KEY);
  return `${base}:${sig}`;
}

export async function verifyUnsubscribeToken(token: string): Promise<{ userId: string; contactId: string } | null> {
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [userId, contactId, sig] = parts;
  const base = `${userId}:${contactId}`;
  const isValid = await verifyHMAC(base, HMAC_KEY, sig);
  if (!isValid) return null;
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


