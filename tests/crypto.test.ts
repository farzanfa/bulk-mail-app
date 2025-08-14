import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '@/lib/crypto';

describe('crypto', () => {
  it('encrypts and decrypts', () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const msg = 'hello';
    const enc = encrypt(msg);
    const dec = decrypt(enc);
    expect(dec).toBe(msg);
  });
});


