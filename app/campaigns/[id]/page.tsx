"use client";
import { useEffect, useState } from 'react';

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

  const completed = c ? c.recipients.filter((r: any) => r.status !== 'pending').length : 0;
  const progress = c ? Math.round((completed / Math.max(1, c.recipients.length)) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaign {id}</h1>
        <div className="flex gap-2">
          <button onClick={pause} className="px-3 py-2 border rounded">Pause</button>
        </div>
      </div>
      <div className="mt-4 bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500 mb-1">Progress</div>
        <div className="h-3 bg-gray-100 rounded">
          <div className="h-3 bg-green-500 rounded" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-sm text-gray-600 mt-1">{completed} / {c?.recipients.length || 0}</div>
      </div>
      <div className="mt-4 bg-white rounded shadow">
        <div className="p-3 font-medium">Recipients</div>
        <div className="divide-y">
          {rec.map((r) => (
            <div key={r.id} className="p-3 flex items-center justify-between text-sm">
              <div className="truncate max-w-md">{r.rendered_subject || '(pending)'} </div>
              <span className="px-2 py-1 rounded bg-gray-100">{r.status}</span>
            </div>
          ))}
          {rec.length === 0 && <div className="p-3 text-sm text-gray-500">No recipients.</div>}
        </div>
        <div className="p-3 flex justify-between items-center text-sm text-gray-600">
          <a href={`/api/campaigns/${id}/export`} className="px-3 py-2 border rounded">Export CSV</a>
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <div>Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}



