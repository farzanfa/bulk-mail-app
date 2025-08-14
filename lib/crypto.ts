import crypto from 'node:crypto';

function getKey(): Buffer {
  const keyStr = process.env.ENCRYPTION_KEY || '';
  if (!keyStr) throw new Error('ENCRYPTION_KEY not set');
  // Support hex or base64; expect 32 bytes for AES-256-GCM
  let key: Buffer | null = null;
  try {
    key = Buffer.from(keyStr, 'hex');
  } catch {
    key = null;
  }
  if (!key || key.length !== 32) {
    const alt = Buffer.from(keyStr, 'base64');
    if (alt.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (hex or base64)');
    return alt;
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString('base64');
  return payload;
}

export function decrypt(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return plaintext;
}


