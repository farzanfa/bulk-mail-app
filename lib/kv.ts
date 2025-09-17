import { Redis } from '@upstash/redis';

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return undefined;
}

let instance: Redis | null = null;

function createClient(): Redis {
  const restUrl =
    getEnv('KV_REST_API_URL') ||
    getEnv('UPSTASH_REDIS_REST_URL') ||
    getEnv('REDIS_REST_URL');

  const restToken =
    getEnv('KV_REST_API_TOKEN') ||
    getEnv('UPSTASH_REDIS_REST_TOKEN') ||
    getEnv('REDIS_REST_TOKEN');

  if (!restUrl || !restToken) {
    const missing = [!restUrl && 'KV_REST_API_URL', !restToken && 'KV_REST_API_TOKEN']
      .filter(Boolean)
      .join(', ');
    throw new Error(
      `KV configuration missing: ${missing}. Ensure REST URL and TOKEN are set. ` +
        `Checked envs: KV_REST_API_URL/UPSTASH_REDIS_REST_URL, KV_REST_API_TOKEN/UPSTASH_REDIS_REST_TOKEN.`
    );
  }
  return new Redis({ url: restUrl, token: restToken });
}

export const kv = new Proxy({}, {
  get(_target, prop, _receiver) {
    if (instance === null) {
      instance = createClient();
    }
    const anyClient = instance as any;
    const value = anyClient[prop];
    if (typeof value === 'function') return value.bind(anyClient);
    return value;
  }
}) as unknown as Redis;


