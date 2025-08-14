import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = getAuthUrl((session as any).user.id);
  const { searchParams } = new URL(req.url);
  if (searchParams.get('redirect') === '1') {
    return NextResponse.redirect(url);
  }
  return NextResponse.json({ url });
}


