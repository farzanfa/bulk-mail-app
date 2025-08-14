import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    redirect('/login');
  }

  const [googleCount, campaigns] = await Promise.all([
    prisma.google_accounts.count({ where: { user_id: userId! } }),
    prisma.campaigns.findMany({ where: { user_id: userId! }, orderBy: { created_at: 'desc' }, take: 5 })
  ]);
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Google Accounts</div>
          <div className="text-2xl">{googleCount}</div>
          <a href="/api/google/oauth/url?redirect=1" className="text-blue-600 text-sm">Connect Google</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Campaigns</div>
          <div className="text-2xl">{campaigns.length}</div>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="font-medium mb-2">Recent Campaigns</h2>
        <div className="bg-white rounded shadow divide-y">
          {campaigns.map((c: any) => (
            <div key={c.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.id}</div>
                <div className="text-sm text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


