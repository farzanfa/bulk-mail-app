"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Section, Button, Card, PrimaryButton } from '@/components/ui';
import { StatusBadge } from '@/components/status';
import { ConfirmButton } from '@/components/confirm';
import { CampaignNewModal } from '@/components/CampaignNewModal';

export default function CampaignsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

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

  const [busyRun, setBusyRun] = useState(false);
  const [busyLaunch, setBusyLaunch] = useState(false);
  const [busyPause, setBusyPause] = useState(false);
  async function launch() {
    if (!current) return;
    setBusyLaunch(true);
    const res = await fetch(`/api/campaigns/${current.id}/launch`, { method: 'POST' });
    if (!res.ok) { toast.error('Launch failed'); return; }
    toast.success('Campaign launched');
    await refresh();
    await openCampaignModal(current.id);
    setBusyLaunch(false);
  }
  async function pause() {
    if (!current) return;
    setBusyPause(true);
    const res = await fetch(`/api/campaigns/${current.id}/pause`, { method: 'POST' });
    if (!res.ok) { toast.error('Pause failed'); return; }
    toast.success('Campaign paused');
    await refresh();
    await openCampaignModal(current.id);
    setBusyPause(false);
  }
  async function runNow() {
    if (!current) return;
    setBusyRun(true);
    const res = await fetch(`/api/campaigns/${current.id}/run`, { method: 'POST' });
    if (!res.ok) { toast.error('Run failed'); return; }
    toast.success('Worker triggered');
    await refresh();
    await openCampaignModal(current.id);
    setBusyRun(false);
  }
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <div className="flex items-center gap-2">
          <ConfirmButton
            onConfirm={async () => {
              if (selected.length === 0) return;
              const res = await fetch('/api/campaigns', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }) });
              const j = await res.json();
              if (!res.ok) { return; }
              setSelected([]);
              await refresh();
            }}
            disabled={selected.length===0}
            className="disabled:opacity-50"
            title="Delete selected campaigns?"
            description={`This will remove ${selected.length} campaigns and their recipients.`}
            confirmText="Delete"
          >Delete Selected</ConfirmButton>
          <button onClick={() => setOpenNew(true)} className="px-3 py-2 bg-black text-white rounded text-sm">New Campaign</button>
        </div>
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
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                        checked={selected.includes(c.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelected(e.target.checked ? [...selected, c.id] : selected.filter(x => x !== c.id));
                        }}
                      />
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
                <ConfirmButton
                  className="text-sm"
                  title="Delete campaign?"
                  description="This will delete the campaign and its recipients."
                  confirmText="Delete"
                  onConfirm={async () => {
                    if (!current) return;
                    const res = await fetch(`/api/campaigns/${current.id}`, { method: 'DELETE' });
                    if (!res.ok) return;
                    setOpenEdit(false);
                    await refresh();
                  }}
                >Delete</ConfirmButton>
                <Button onClick={runNow} loading={busyRun} className="text-sm">Run now</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openNew && (
        <CampaignNewModal onClose={() => setOpenNew(false)} />
      )}
    </div>
  );
}



