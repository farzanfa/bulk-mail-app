import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { head } from '@vercel/blob';
import { parse as parseSync } from 'csv-parse/sync';
import { ensureUserIdFromSession } from '@/lib/user';
import { getPlanLimits } from '@/lib/plan';

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
  
  // Get plan limits and current contact count
  const planLimits = await getPlanLimits(sessionUserId);
  const currentContactCount = await prisma.contacts.count({ where: { user_id: sessionUserId } });
  const maxContacts = planLimits.maxContacts === -1 ? Number.POSITIVE_INFINITY : planLimits.maxContacts;
  const remainingContacts = maxContacts === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(0, maxContacts - currentContactCount);
  
  const batch: Array<{ email: string; fields: Record<string, unknown> }> = [];
  let totalProcessed = 0;
  let skippedDueToLimit = 0;
  let columns: string[] | null = null;
  const normalizeKey = (k: string) => String(k)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_');
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
    if (!columns) columns = Object.keys(rec).filter(k => !['email', 'Email', 'EMAIL', emailKey as string].includes(k)).map(normalizeKey);
    delete (rec as any).email; delete (rec as any).Email; delete (rec as any).EMAIL;
    if (emailKey) delete (rec as any)[emailKey as string];
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rec)) {
      normalized[normalizeKey(key)] = value;
    }
    
    // Check if we've reached the contact limit
    if (totalProcessed >= remainingContacts) {
      skippedDueToLimit++;
      continue;
    }
    
    batch.push({ email, fields: normalized });
    if (batch.length >= 500) {
      // Upsert-like behavior: attach existing contacts to this upload, insert new ones
      const chunk = batch.splice(0, batch.length);
      const emails = chunk.map(c => c.email);
      const existing = await prisma.contacts.findMany({ where: { user_id: upload.user_id, email: { in: emails } }, select: { id: true, email: true } });
      const existingSet = new Set(existing.map(e => e.email));
      const toInsert = chunk.filter(c => !existingSet.has(c.email));
      const toAttach = existing;
      if (toInsert.length) {
        await prisma.contacts.createMany({ data: toInsert.map(r => ({ user_id: upload.user_id, upload_id, email: r.email, fields: r.fields as any })) });
      }
      // Attach existing to this upload_id
      for (const ex of toAttach) {
        await prisma.contacts.update({ where: { id: ex.id }, data: { upload_id } });
      }
      totalProcessed += chunk.length;
    }
  }
  if (batch.length) {
    const chunk = batch.splice(0, batch.length);
    const emails = chunk.map(c => c.email);
    const existing = await prisma.contacts.findMany({ where: { user_id: upload.user_id, email: { in: emails } }, select: { id: true, email: true } });
    const existingSet = new Set(existing.map(e => e.email));
    const toInsert = chunk.filter(c => !existingSet.has(c.email));
    const toAttach = existing;
    if (toInsert.length) {
      await prisma.contacts.createMany({ data: toInsert.map(r => ({ user_id: upload.user_id, upload_id, email: r.email, fields: r.fields as any })) });
    }
    for (const ex of toAttach) {
      await prisma.contacts.update({ where: { id: ex.id }, data: { upload_id } });
    }
    totalProcessed += chunk.length;
  }

  await prisma.uploads.update({ where: { id: upload_id }, data: { row_count: totalProcessed, ...(columns ? { columns: columns as any } : {}) } });
  
  const response: any = { ok: true, total: totalProcessed };
  if (skippedDueToLimit > 0) {
    response.warning = `Contact limit reached. ${skippedDueToLimit} contacts were skipped. Your plan allows ${maxContacts} total contacts.`;
    response.upgradeRequired = true;
    response.skipped = skippedDueToLimit;
  }
  
  return NextResponse.json(response);
}


