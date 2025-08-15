import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui';

export default async function NotFound() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean((session as any)?.user);
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="p-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-black text-white">MailWeaver</div>
        <div className="text-5xl font-bold tracking-tight">404</div>
        <div className="text-xl font-semibold">Page not found</div>
        <p className="text-sm text-gray-600">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <a href="/" className="px-3 py-2 border rounded text-sm">Home</a>
          <a href={isAuthed ? '/dashboard' : '/'} className="px-3 py-2 bg-black text-white rounded text-sm">
            {isAuthed ? 'Go to Dashboard' : 'Explore Home'}
          </a>
        </div>
      </Card>
    </div>
  );
}


