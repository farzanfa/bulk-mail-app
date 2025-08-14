"use client";
import { useEffect, useState } from 'react';

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
      const cols = [] as string[]; // let parse endpoint infer
      const create = await fetch('/api/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blob_key: u.key, filename: file.name, columns: cols, row_count: 0 }) });
      const created = await create.json();
      if (!create.ok) throw new Error(created.error || 'upload create failed');
      // 3) parse to contacts
      const parse = await fetch('/api/uploads/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blob_key: u.key, upload_id: created.upload.id }) });
      const parsed = await parse.json();
      if (!parse.ok) throw new Error(parsed.error || 'parse failed');
      await refresh();
      alert(`Parsed ${parsed.total} contacts`);
    } catch (e: any) {
      alert(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Uploads</h1>
        <label className="inline-flex items-center gap-2 text-sm bg-black text-white px-3 py-2 rounded cursor-pointer">
          <input type="file" accept=".csv" className="hidden" onChange={onFileChange} disabled={busy} />
          {busy ? 'Uploading…' : 'Upload CSV'}
        </label>
      </div>
      <div className="mt-4 bg-white rounded shadow divide-y">
        {uploads.map(u => (
          <a key={u.id} href={`/uploads/${u.id}`} className="block p-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{u.filename}</div>
                <div className="text-sm text-gray-500">{new Date(u.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-600">{u.row_count} rows</div>
            </div>
          </a>
        ))}
        {uploads.length === 0 && <div className="p-3 text-sm text-gray-500">No uploads yet.</div>}
      </div>
    </div>
  );
}


