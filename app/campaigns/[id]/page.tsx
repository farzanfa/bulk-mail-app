"use client";
import { useEffect, useState } from 'react';
import { Section, Button } from '@/components/ui';
import { ConfirmButton } from '@/components/confirm';
import { StatusBadge } from '@/components/status';

export default function CampaignDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [c, setC] = useState<any | null>(null);
  const [rec, setRec] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;
  async function load() {
    const cRes = await fetch(`/api/campaigns/${id}`, { cache: 'no-store' });
    const cJson = await cRes.json();
    setC(cJson.campaign);
    const rRes = await fetch(`/api/campaigns/${id}/recipients?page=${page}`, { cache: 'no-store' });
    const rJson = await rRes.json();
    setRec(rJson.items || []);
    setTotal(rJson.total || 0);
  }
  useEffect(() => { load(); }, [id, page]);

  async function pause() {
    await fetch(`/api/campaigns/${id}/pause`, { method: 'POST' });
    await load();
  }
  async function runNow() {
    await fetch(`/api/campaigns/${id}/run`, { method: 'POST' });
    await load();
  }

  const completed = c ? c.recipients.filter((r: any) => r.status !== 'pending').length : 0;
  const progress = c ? Math.round((completed / Math.max(1, c.recipients.length)) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaign {id}</h1>
        <div className="flex gap-2">
          <ConfirmButton onConfirm={pause}>Pause</ConfirmButton>
          <Button onClick={runNow}>Run now</Button>
        </div>
      </div>
      <Section title="Progress">
        <div className="text-sm text-gray-500 mb-1">Progress</div>
        <div className="h-3 bg-gray-100 rounded">
          <div className="h-3 bg-green-500 rounded" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-sm text-gray-600 mt-1">{completed} / {c?.recipients.length || 0}</div>
      </Section>
      <Section title="Recipients" actions={<a href={`/api/campaigns/${id}/export`} className="px-3 py-2 border rounded text-sm">Export CSV</a>}>
        <div className="divide-y">
          {rec.map((r) => (
            <div key={r.id} className="p-3 flex items-center justify-between text-sm">
              <div className="truncate max-w-md">{r.rendered_subject || '(pending)'} </div>
              <StatusBadge value={r.status} />
            </div>
          ))}
          {rec.length === 0 && <div className="p-3 text-sm text-gray-500">No recipients.</div>}
        </div>
        <div className="p-3 flex justify-between items-center text-sm text-gray-600">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <div>Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </Section>
    </div>
  );
}



