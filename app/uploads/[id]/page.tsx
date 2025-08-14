"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function UploadDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [upload, setUpload] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 50;

  async function load() {
    const u = await fetch(`/api/uploads/${id}`, { cache: 'no-store' }).then(r => r.json());
    setUpload(u.upload);
    const c = await fetch(`/api/uploads/${id}/contacts?search=${encodeURIComponent(search)}&page=${page}`, { cache: 'no-store' }).then(r => r.json());
    setItems(c.items || []);
    setTotal(c.total || 0);
  }
  useEffect(() => { load(); }, [id, page]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Upload</h1>
        <div className="flex gap-2">
          <button onClick={async () => {
            if (!confirm('Delete this upload and its contacts?')) return;
            const res = await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
            if (!res.ok) { toast.error('Delete failed'); return; }
            toast.success('Upload deleted');
            window.location.href = '/uploads';
          }} className="text-sm border rounded px-3 py-2">Delete</button>
          <a href="/uploads" className="text-sm text-blue-600">Back</a>
        </div>
      </div>
      {upload && (
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="font-medium">{upload.filename}</div>
          <div className="text-sm text-gray-500">{new Date(upload.created_at).toLocaleString()} • {upload.row_count} rows</div>
          <div className="text-sm text-gray-500 mt-1">Columns: {Array.isArray(upload.columns) ? upload.columns.join(', ') : ''}</div>
          <div className="text-xs text-gray-500 mt-1">Note: The CSV must have an 'email' column. Other columns are available as variables (e.g., <code>{'{{ first_name }}'}</code>).</div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <input placeholder="Search email" className="border rounded p-2 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => { setPage(1); load(); }} className="px-3 py-2 border rounded text-sm">Search</button>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">first_name</th>
              <th className="p-2 text-left">created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c: any) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.email}</td>
                <td className="p-2">{c.fields?.first_name || ''}</td>
                <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="p-3 text-gray-500">No contacts.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex justify-between text-sm text-gray-600">
        <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
        <div>Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
        <button disabled={page>=Math.ceil(total/pageSize)} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );
}


