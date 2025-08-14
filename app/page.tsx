import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean((session as any)?.user?.id);
  redirect(isAuthed ? '/dashboard' : '/login');
}


