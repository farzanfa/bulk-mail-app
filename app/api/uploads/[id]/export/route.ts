import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session as any).user.id as string;
  const upload = await prisma.uploads.findFirst({ where: { id: params.id, user_id: userId } });
  if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const rec = await prisma.contacts.findMany({ where: { upload_id: upload.id }, orderBy: { created_at: 'asc' } });
  const rows = [
    ['email', 'first_name', 'created_at'],
    ...rec.map(r => [
      r.email,
      typeof (r.fields as any)?.first_name === 'string' ? (r.fields as any).first_name : '',
      r.created_at.toISOString()
    ])
  ];
  const csv = rows.map(r => r.map(field => {
    const s = String(field);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="upload_${upload.id}_contacts.csv"`
    }
  });
}




