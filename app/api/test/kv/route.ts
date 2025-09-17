import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

export const runtime = 'nodejs';

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  if (typeof v === 'string' && v.trim().length > 0) return v;
  return undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urlCandidates = ['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL', 'REDIS_REST_URL'] as const;
  const tokenCandidates = ['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_REST_TOKEN'] as const;

  let chosenUrlVar: string | null = null;
  let chosenTokenVar: string | null = null;
  let restUrl: string | undefined;
  let restToken: string | undefined;

  for (const n of urlCandidates) {
    const val = getEnv(n);
    if (val) {
      chosenUrlVar = n;
      restUrl = val;
      break;
    }
  }
  for (const n of tokenCandidates) {
    const val = getEnv(n);
    if (val) {
      chosenTokenVar = n;
      restToken = val;
      break;
    }
  }

  const diagnostics: any = {
    chosenUrlVar,
    chosenTokenVar,
    urlHost: (() => {
      try { return restUrl ? new URL(restUrl).host : null; } catch { return null; }
    })(),
    present: Object.fromEntries([
      ...urlCandidates.map(n => [n, Boolean(getEnv(n))]),
      ...tokenCandidates.map(n => [n, Boolean(getEnv(n))])
    ])
  };

  try {
    const setKey = 'kv_healthcheck';
    await kv.set(setKey, 'ok');
    const val = await kv.get<string>(setKey);
    return NextResponse.json({ ok: true, value: val, diagnostics });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err), diagnostics }, { status: 500 });
  }
}


