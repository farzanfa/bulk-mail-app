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

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    googleCount,
    totalContacts,
    totalTemplates,
    totalCampaigns,
    recentCampaigns,
    sentByDay
  ] = await Promise.all([
    prisma.google_accounts.count({ where: { user_id: userId! } }),
    prisma.contacts.count({ where: { user_id: userId! } }),
    prisma.templates.count({ where: { user_id: userId! } }),
    prisma.campaigns.count({ where: { user_id: userId! } }),
    prisma.campaigns.findMany({ where: { user_id: userId! }, orderBy: { created_at: 'desc' }, take: 5 }),
    prisma.campaign_recipients.groupBy({
      by: ['created_at'],
      _count: { _all: true },
      where: { status: 'sent', campaign: { user_id: userId! }, created_at: { gte: since } }
    })
  ]);

  // Build 7-day series (UTC days)
  const dayCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return { day: new Date(d), count: 0 };
  });
  for (const row of sentByDay) {
    const d = new Date(row.created_at as unknown as Date);
    d.setUTCHours(0, 0, 0, 0);
    const idx = dayCounts.findIndex(x => x.day.getTime() === d.getTime());
    if (idx >= 0) dayCounts[idx].count += (row._count as any)._all as number;
  }

  const max = Math.max(1, ...dayCounts.map(d => d.count));
  const points = dayCounts.map((d, i) => `${(i / 6) * 100},${100 - (d.count / max) * 100}`).join(' ');
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Google Accounts</div>
          <div className="text-2xl">{googleCount}</div>
          <a href="/api/google/oauth/url?redirect=1" className="text-blue-600 text-sm">Connect Google</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Campaigns</div>
          <div className="text-2xl">{totalCampaigns}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Contacts</div>
          <div className="text-2xl">{totalContacts}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Templates</div>
          <div className="text-2xl">{totalTemplates}</div>
        </div>
      </div>
      <div className="mt-6 bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Sent (last 7 days)</h2>
          <div className="text-xs text-gray-500">max {max}</div>
        </div>
        <svg viewBox="0 0 100 100" className="w-full h-24">
          <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
        </svg>
      </div>
      <div className="mt-6">
        <h2 className="font-medium mb-2">Recent Campaigns</h2>
        <div className="bg-white rounded shadow divide-y">
          {recentCampaigns.map((c: any) => (
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


