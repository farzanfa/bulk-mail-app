"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Section, Input, PrimaryButton, Button } from '@/components/ui';
import { ConfirmButton } from '@/components/confirm';

export default function UploadsPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  async function refresh() {
    const res = await fetch('/api/uploads', { cache: 'no-store' });
    const json = await res.json();
    setUploads(json.uploads || []);
  }
  useEffect(() => { refresh(); }, []);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      // 1) upload to blob
      const fd = new FormData();
      fd.append('file', file);
      fd.append('filename', file.name);
      const up = await fetch('/api/blob-upload', { method: 'POST', body: fd });
      const u = await up.json();
      if (!up.ok) throw new Error(u.error || 'blob upload failed');
      // 2) create upload row
      const create = await fetch('/api/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blob_key: u.url, filename: file.name, columns: [], row_count: 0 }) });
      const created = await create.json();
      if (!create.ok) throw new Error(created.error || 'upload create failed');
      // 3) parse to contacts
      const parse = await fetch('/api/uploads/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blob_key: u.url, upload_id: created.upload.id }) });
      const parsed = await parse.json();
      if (!parse.ok) throw new Error(parsed.error || 'parse failed');
      await refresh();
      toast.success(`Parsed ${parsed.total} contacts`);
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  const [selected, setSelected] = useState<string[]>([]);

  async function bulkDelete() {
    if (selected.length === 0) return;
    if (!confirm(`Delete ${selected.length} uploads and their contacts?`)) return;
    const res = await fetch('/api/uploads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }) });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || 'Delete failed'); return; }
    toast.success(`Deleted ${json.deleted} uploads`);
    setSelected([]);
    await refresh();
  }

  async function openUploadModal(id: string) {
    try {
      const r = await fetch(`/api/uploads/${id}`, { cache: 'no-store' });
      const j = await r.json();
      setCurrent(j.upload);
      setOpenEdit(true);
    } catch (e: any) {
      toast.error('Failed to load upload');
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Uploads</h1>
        <div className="flex items-center gap-2">
          <ConfirmButton
            onConfirm={async () => { await bulkDelete(); }}
            disabled={selected.length===0}
            className="disabled:opacity-50"
            title="Delete selected uploads?"
            description={`This will remove ${selected.length} uploads and their contacts.`}
            confirmText="Delete"
          >Delete Selected</ConfirmButton>
          <label className="inline-flex items-center gap-2 text-sm bg-black text-white px-3 py-2 rounded cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={onFileChange} disabled={busy} />
            {busy ? (
              <span className="inline-flex items-center gap-2"><span className="animate-spin inline-block h-4 w-4 border-2 border-white/60 border-t-white rounded-full" /> Uploading…</span>
            ) : 'Upload CSV'}
          </label>
        </div>
      </div>
      <Section title="Recent uploads">
        {uploads.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No uploads yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads.map(u => (
              <div
                key={u.id}
                className="p-4 rounded-lg border bg-white hover:shadow transition cursor-pointer"
                onClick={() => openUploadModal(u.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(u.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, u.id] : selected.filter(x => x !== u.id))} />
                    <span className="font-medium break-all">{u.filename}</span>
                  </label>
                  <div className="text-xs text-gray-600 whitespace-nowrap">{u.row_count} rows</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{new Date(u.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {openEdit && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-card w-full max-w-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Upload details</div>
              <button aria-label="Close" className="p-2" onClick={() => setOpenEdit(false)}>✕</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><div className="text-gray-500">Filename</div><div className="font-medium break-all text-right ml-3">{current.filename}</div></div>
              <div className="flex items-center justify-between"><div className="text-gray-500">Rows</div><div className="font-medium">{current.row_count}</div></div>
              <div className="flex items-center justify-between"><div className="text-gray-500">Uploaded</div><div className="font-medium">{new Date(current.created_at).toLocaleString()}</div></div>
            </div>
            <div className="p-4 border-t flex items-center justify-between gap-2">
              <a href={`/uploads/${current.id}`} className="text-sm underline">Open full page</a>
              <div className="flex items-center gap-2">
                <a href={`/api/uploads/${current.id}/export`} className="px-3 py-2 border rounded text-sm">Export CSV</a>
                <ConfirmButton
                  className="text-sm"
                  title="Delete upload?"
                  description="This will also delete contacts created from this upload."
                  confirmText="Delete"
                  onConfirm={async () => {
                    const res = await fetch(`/api/uploads/${current.id}`, { method: 'DELETE' });
                    if (!res.ok) { toast.error('Delete failed'); return; }
                    toast.success('Upload deleted');
                    setOpenEdit(false);
                    await refresh();
                  }}
                >Delete</ConfirmButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



