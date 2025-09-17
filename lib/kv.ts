// KV client wrapper with graceful fallback.
// Uses Vercel KV when available; otherwise falls back to an in-memory store.
// Prevents hard failures (e.g., DNS ENOTFOUND) from crashing jobs.
import * as VercelKV from '@vercel/kv';

type KvSetOptions = {
  ex?: number; // seconds to expire
};

type KvLike = {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, opts?: KvSetOptions): Promise<'OK' | void>;
  del?(key: string): Promise<number | void>;
};

class InMemoryKV implements KvLike {
  private store = new Map<string, { value: unknown; expiresAt?: number }>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (typeof item.expiresAt === 'number' && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return (item.value as T) ?? null;
  }

  async set<T = unknown>(key: string, value: T, opts?: KvSetOptions): Promise<'OK' | void> {
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }
}

function createSafeKV(): KvLike {
  const underlying: KvLike | undefined = (VercelKV as any)?.kv;
  if (!underlying) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[kv] @vercel/kv not available; using in-memory fallback');
    }
    return new InMemoryKV();
  }

  const fallback = new InMemoryKV();

  const safe: KvLike = {
    async get<T = unknown>(key: string): Promise<T | null> {
      try {
        return await underlying.get<T>(key);
      } catch (err: any) {
        const code = err?.code || err?.cause?.code;
        const hostname = err?.cause?.hostname;
        console.error('[kv.get] falling back due to error:', { code, hostname, message: err?.message });
        return await fallback.get<T>(key);
      }
    },
    async set<T = unknown>(key: string, value: T, opts?: KvSetOptions): Promise<'OK' | void> {
      try {
        return await underlying.set<T>(key, value, opts);
      } catch (err: any) {
        const code = err?.code || err?.cause?.code;
        const hostname = err?.cause?.hostname;
        console.error('[kv.set] falling back due to error:', { code, hostname, message: err?.message });
        return await fallback.set<T>(key, value, opts);
      }
    },
    async del(key: string): Promise<number | void> {
      try {
        if (typeof underlying.del === 'function') {
          return await underlying.del(key as any);
        }
      } catch (err: any) {
        const code = err?.code || err?.cause?.code;
        const hostname = err?.cause?.hostname;
        console.error('[kv.del] falling back due to error:', { code, hostname, message: err?.message });
      }
      return await (fallback.del?.(key) as Promise<number>);
    }
  };

  return safe;
}

export const kv: KvLike = createSafeKV();

