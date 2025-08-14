import { kv } from './kv';

export async function tokenBucket({ key, limitPerMinute }: { key: string; limitPerMinute: number; }): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60_000;
  const bucketKey = `rate:${key}`;
  const refillRatePerMs = limitPerMinute / windowMs;

  const res = await kv.get<{
    tokens: number;
    last: number;
  }>(bucketKey);

  let tokens = res?.tokens ?? limitPerMinute;
  const last = res?.last ?? now;
  const delta = now - last;
  tokens = Math.min(limitPerMinute, tokens + delta * refillRatePerMs);

  if (tokens < 1) {
    await kv.set(bucketKey, { tokens, last: now });
    return false;
  }

  tokens -= 1;
  await kv.set(bucketKey, { tokens, last: now });
  return true;
}

export function backoffDelayMs(attempt: number): number {
  const base = Math.pow(2, attempt) * 1000;
  const jitter = Math.floor(Math.random() * 500);
  return Math.min(base + jitter, 60_000);
}


