"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Section, Button, Card } from '@/components/ui';
import { StatusBadge } from '@/components/status';
import { ConfirmButton } from '@/components/confirm';

export default function CampaignsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);

  async function refresh() {
    const res = await fetch('/api/campaigns', { cache: 'no-store' });
    const json = await res.json();
    setItems(json.campaigns || []);
  }

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  async function openCampaignModal(id: string) {
    try {
      const r = await fetch(`/api/campaigns/${id}`, { cache: 'no-store' });
      const j = await r.json();
      setCurrent(j.campaign);
      setOpenEdit(true);
    } catch (e: any) {
      toast.error('Failed to load campaign');
    }
  }

  async function launch() {
    if (!current) return;
    const res = await fetch(`/api/campaigns/${current.id}/launch`, { method: 'POST' });
    if (!res.ok) { toast.error('Launch failed'); return; }
    toast.success('Campaign launched');
    await refresh();
    await openCampaignModal(current.id);
  }
  async function pause() {
    if (!current) return;
    const res = await fetch(`/api/campaigns/${current.id}/pause`, { method: 'POST' });
    if (!res.ok) { toast.error('Pause failed'); return; }
    toast.success('Campaign paused');
    await refresh();
    await openCampaignModal(current.id);
  }
  async function runNow() {
    if (!current) return;
    const res = await fetch(`/api/campaigns/${current.id}/run`, { method: 'POST' });
    if (!res.ok) { toast.error('Run failed'); return; }
    toast.success('Worker triggered');
    await refresh();
    await openCampaignModal(current.id);
  }
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
              <div key={c.id} className="block cursor-pointer" onClick={() => openCampaignModal(c.id)}>
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
              </div>
            ))}
          </div>
        )}
      </Section>
      {openEdit && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-card w-full max-w-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Campaign details</div>
              <button aria-label="Close" className="p-2" onClick={() => setOpenEdit(false)}>✕</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><div className="text-gray-500">Name</div><div className="font-medium text-right ml-3 truncate max-w-[16rem]">{current.name || current.id}</div></div>
              <div className="flex items-center justify-between"><div className="text-gray-500">Status</div><div className="font-medium"><StatusBadge value={current.status} /></div></div>
              <div className="flex items-center justify-between"><div className="text-gray-500">Started</div><div className="font-medium">{current.started_at ? new Date(current.started_at).toLocaleString() : '—'}</div></div>
              <div className="flex items-center justify-between"><div className="text-gray-500">Template</div><div className="font-medium">{current.template_id}</div></div>
              <div className="flex items-center justify-between"><div className="text-gray-500">Upload</div><div className="font-medium">{current.upload_id}</div></div>
              {Array.isArray(current.recipients) && (
                <div className="flex items-center justify-between"><div className="text-gray-500">Recipients</div><div className="font-medium">{current.recipients.length}</div></div>
              )}
            </div>
            <div className="p-4 border-t flex items-center justify-between gap-2">
              <a href={`/campaigns/${current.id}`} className="text-sm underline">Open full page</a>
              <div className="flex items-center gap-2">
                <a href={`/api/campaigns/${current.id}/export`} className="px-3 py-2 border rounded text-sm">Export CSV</a>
                {(current.status === 'draft' || current.status === 'paused') && (
                  <ConfirmButton className="text-sm" title="Launch campaign?" description="This will begin sending emails to recipients." confirmText="Launch" onConfirm={launch}>Launch</ConfirmButton>
                )}
                {current.status !== 'paused' && current.status !== 'draft' && (
                  <ConfirmButton className="text-sm" title="Pause campaign?" confirmText="Pause" onConfirm={pause}>Pause</ConfirmButton>
                )}
                <Button onClick={runNow} className="text-sm">Run now</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



