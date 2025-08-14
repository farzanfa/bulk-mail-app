import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { head } from '@vercel/blob';
import { parse as parseSync } from 'csv-parse/sync';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const { blob_key, upload_id } = await req.json();
  if (!blob_key || !upload_id) return NextResponse.json({ error: 'blob_key and upload_id required' }, { status: 400 });

  const { url } = await head(blob_key);
  const res = await fetch(url);
  if (!res.ok || !res.body) return NextResponse.json({ error: 'Failed to fetch blob' }, { status: 400 });

  const text = await res.text();
  const rows = parseSync(text, { columns: true, bom: true, skip_empty_lines: true }) as Array<Record<string, unknown>>;
  const batch: Array<{ email: string; fields: Record<string, unknown> }> = [];
  let total = 0;
  for (const record of rows) {
    const rec: Record<string, unknown> = { ...record };
    const email = String((rec.email || rec.Email || rec.EMAIL) ?? '').trim();
    if (!email) continue;
    delete rec.email; delete rec.Email; delete rec.EMAIL;
    batch.push({ email, fields: rec });
    if (batch.length >= 500) {
      await prisma.contacts.createMany({ data: batch.map(r => ({ user_id: userId, upload_id, email: r.email, fields: r.fields as any })) });
      total += batch.length;
      batch.length = 0;
    }
  }
  if (batch.length) {
    await prisma.contacts.createMany({ data: batch.map(r => ({ user_id: userId, upload_id, email: r.email, fields: r.fields as any })) });
    total += batch.length;
  }

  await prisma.uploads.update({ where: { id: upload_id }, data: { row_count: total } });
  return NextResponse.json({ ok: true, total });
}


