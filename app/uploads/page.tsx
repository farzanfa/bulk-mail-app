"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Section, Input, PrimaryButton, Button } from '@/components/ui';
import { ConfirmButton } from '@/components/confirm';

export default function UploadsPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
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
    if (!res.ok) return toast.error(json.error || 'Delete failed');
    toast.success(`Deleted ${json.deleted} uploads`);
    setSelected([]);
    await refresh();
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Uploads</h1>
        <div className="flex items-center gap-2">
          <ConfirmButton onConfirm={bulkDelete} disabled={selected.length===0} className="disabled:opacity-50">Delete Selected</ConfirmButton>
          <label className="inline-flex items-center gap-2 text-sm bg-black text-white px-3 py-2 rounded cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={onFileChange} disabled={busy} />
            {busy ? 'Uploading…' : 'Upload CSV'}
          </label>
        </div>
      </div>
      <Section title="Recent uploads">
        {uploads.map(u => (
          <div key={u.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, u.id] : selected.filter(x => x !== u.id))} />
              <a href={`/uploads/${u.id}`} className="font-medium hover:underline">{u.filename}</a>
              <div className="text-sm text-gray-500">{new Date(u.created_at).toLocaleString()}</div>
            </div>
            <div className="text-sm text-gray-600">{u.row_count} rows</div>
          </div>
        ))}
        {uploads.length === 0 && <div className="p-3 text-sm text-gray-500">No uploads yet.</div>}
      </Section>
    </div>
  );
}



