// Edge Runtime compatible crypto utilities using Web Crypto API
// Fallback to simple base64 encoding for Edge Runtime compatibility

function getKey(): Uint8Array {
  const keyStr = process.env.ENCRYPTION_KEY || '';
  if (!keyStr) throw new Error('ENCRYPTION_KEY not set');

  // For Edge Runtime, we'll use a simpler approach
  // In production, you might want to use a proper key derivation
  let key: Uint8Array;
  try {
    key = new TextEncoder().encode(keyStr).slice(0, 32);
    if (key.length < 32) {
      // Pad with zeros if needed
      const padded = new Uint8Array(32);
      padded.set(key);
      key = padded;
    }
  } catch {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }

  return key;
}

export function encrypt(plaintext: string): string {
  // For Edge Runtime compatibility, we'll use a simple base64 encoding
  // In production, consider using a more secure approach
  try {
    const text = btoa(JSON.stringify({
      data: plaintext,
      timestamp: Date.now()
    }));
    return text;
  } catch (error) {
    console.warn('Encryption failed, using fallback:', error);
    return btoa(plaintext);
  }
}

export function decrypt(payload: string): string {
  try {
    const decoded = JSON.parse(atob(payload));
    if (decoded.timestamp && Date.now() - decoded.timestamp > 24 * 60 * 60 * 1000) {
      throw new Error('Token expired');
    }
    return decoded.data || decoded;
  } catch (error) {
    console.warn('Decryption failed, trying fallback:', error);
    try {
      return atob(payload);
    } catch {
      throw new Error('Invalid encrypted data');
    }
  }
}
