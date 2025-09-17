import { Redis } from '@upstash/redis';

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return undefined;
}

const REST_URL =
  getEnv('KV_REST_API_URL') ||
  getEnv('UPSTASH_REDIS_REST_URL') ||
  getEnv('REDIS_REST_URL');

const REST_TOKEN =
  getEnv('KV_REST_API_TOKEN') ||
  getEnv('UPSTASH_REDIS_REST_TOKEN') ||
  getEnv('REDIS_REST_TOKEN');

if (!REST_URL || !REST_TOKEN) {
  const missing = [!REST_URL && 'KV_REST_API_URL', !REST_TOKEN && 'KV_REST_API_TOKEN']
    .filter(Boolean)
    .join(', ');
  throw new Error(
    `KV configuration missing: ${missing}. Ensure REST URL and TOKEN are set. ` +
      `Checked envs: KV_REST_API_URL/UPSTASH_REDIS_REST_URL, KV_REST_API_TOKEN/UPSTASH_REDIS_REST_TOKEN.`
  );
}

export const kv = new Redis({ url: REST_URL, token: REST_TOKEN });


