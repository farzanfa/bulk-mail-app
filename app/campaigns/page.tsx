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
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((c) => (
              <a key={c.id} href={`/campaigns/${c.id}`} className="block">
                <Card className="p-4 h-full hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium truncate max-w-[14rem]">{c.name || c.id}</div>
                      <div className="text-xs text-gray-500">Started: {c.started_at ? new Date(c.started_at).toLocaleString() : '—'}</div>
                    </div>
                    <StatusBadge value={c.status} />
                  </div>
                  <div className="text-xs text-gray-600">Template: <span className="font-medium">{c.template_id}</span></div>
                  <div className="text-xs text-gray-600">Upload: <span className="font-medium">{c.upload_id}</span></div>
                </Card>
              </a>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}



