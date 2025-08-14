import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }
  const name = (form.get('filename') as string) || 'upload.csv';
  const uploaded = await put(name, file, { access: 'public' });
  return NextResponse.json({ key: uploaded.pathname, url: uploaded.url, size: uploaded.size });
}



