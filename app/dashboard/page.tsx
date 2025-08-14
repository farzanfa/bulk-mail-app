import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

async function fetchJSON(path: string) {
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  const base = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : 'http://localhost:3000');
  const cookie = h.get('cookie') || '';
  const res = await fetch(`${base}${path}`, { cache: 'no-store', headers: { cookie } });
  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardPage() {
  const me = await fetchJSON('/api/me');
  const campaigns = await fetchJSON('/api/campaigns');
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Google Accounts</div>
          <div className="text-2xl">{me?.googleAccounts?.length ?? 0}</div>
          <a href="/api/google/oauth/url?redirect=1" className="text-blue-600 text-sm">Connect Google</a>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Campaigns</div>
          <div className="text-2xl">{campaigns?.campaigns?.length ?? 0}</div>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="font-medium mb-2">Recent Campaigns</h2>
        <div className="bg-white rounded shadow divide-y">
          {(campaigns?.campaigns ?? []).slice(0, 5).map((c: any) => (
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


