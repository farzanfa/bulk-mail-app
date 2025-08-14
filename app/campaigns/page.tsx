"use client";
import { useEffect, useState } from 'react';
import { Section, Button, Card } from '@/components/ui';
import { StatusBadge } from '@/components/status';

export default function CampaignsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/campaigns', { cache: 'no-store' });
      const json = await res.json();
      setItems(json.campaigns || []);
      setLoading(false);
    })();
  }, []);
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <a href="/campaigns/new" className="px-3 py-2 bg-black text-white rounded text-sm">New Campaign</a>
      </div>
      <Section title="All campaigns">
        {loading && <div className="p-3 text-sm text-gray-500">Loading…</div>}
        {!loading && items.length === 0 && <div className="p-3 text-sm text-gray-500">No campaigns yet.</div>}
        {items.map((c) => (
          <a key={c.id} href={`/campaigns/${c.id}`} className="block p-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.id}</div>
                <div className="text-sm text-gray-500">Started: {c.started_at ? new Date(c.started_at).toLocaleString() : '—'}</div>
              </div>
              <StatusBadge value={c.status} />
            </div>
          </a>
        ))}
      </Section>
    </div>
  );
}



