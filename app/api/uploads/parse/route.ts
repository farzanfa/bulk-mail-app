import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { head } from '@vercel/blob';
import { parse as parseSync } from 'csv-parse/sync';
import { ensureUserIdFromSession } from '@/lib/user';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = await ensureUserIdFromSession(session).catch(() => '');
  if (!sessionUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { blob_key, upload_id } = await req.json();
  if (!blob_key || !upload_id) return NextResponse.json({ error: 'blob_key and upload_id required' }, { status: 400 });

  const upload = await prisma.uploads.findUnique({ where: { id: upload_id } });
  if (!upload) return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
  if (upload.user_id !== sessionUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let src = blob_key as string;
  if (!/^https?:\/\//i.test(src)) {
    const { url } = await head(blob_key);
    src = url;
  }
  const res = await fetch(src);
  if (!res.ok || !res.body) return NextResponse.json({ error: 'Failed to fetch blob' }, { status: 400 });

  const text = await res.text();
  const rows = parseSync(text, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    delimiter: [',', ';', '\t']
  }) as Array<Record<string, unknown>>;
  const batch: Array<{ email: string; fields: Record<string, unknown> }> = [];
  let total = 0;
  let columns: string[] | null = null;
  // Detect email column name case-insensitively and with loose match
  const headerKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const normalizedKeys = headerKeys.map(k => ({ raw: k, norm: String(k).trim().toLowerCase() }));
  const emailKey = (normalizedKeys.find(k => k.norm === 'email')
    || normalizedKeys.find(k => k.norm.includes('email')))?.raw;
  const seenEmails = new Set<string>();
  for (const record of rows) {
    const rec: Record<string, unknown> = { ...record };
    const email = String((emailKey ? rec[emailKey] : (rec.email || rec.Email || rec.EMAIL)) ?? '').trim().toLowerCase();
    if (!email) continue;
    if (seenEmails.has(email)) continue;
    seenEmails.add(email);
    if (!columns) columns = Object.keys(rec);
    delete (rec as any).email; delete (rec as any).Email; delete (rec as any).EMAIL;
    if (emailKey) delete (rec as any)[emailKey as string];
    batch.push({ email, fields: rec });
    if (batch.length >= 500) {
      const resIns = await prisma.contacts.createMany({
        data: batch.map(r => ({ user_id: upload.user_id, upload_id, email: r.email, fields: r.fields as any })),
        skipDuplicates: true
      });
      total += resIns.count;
      batch.length = 0;
    }
  }
  if (batch.length) {
    const resIns = await prisma.contacts.createMany({
      data: batch.map(r => ({ user_id: upload.user_id, upload_id, email: r.email, fields: r.fields as any })),
      skipDuplicates: true
    });
    total += resIns.count;
  }

  await prisma.uploads.update({ where: { id: upload_id }, data: { row_count: total, ...(columns ? { columns: columns as any } : {}) } });
  return NextResponse.json({ ok: true, total });
}


