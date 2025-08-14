"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmButton } from '@/components/confirm';
import { Section, Input, Button } from '@/components/ui';

export default function UploadDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const [upload, setUpload] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: 'email' | 'created'; dir: 'asc' | 'desc' }>({ key: 'created', dir: 'asc' });
  const [selected, setSelected] = useState<string[]>([]);
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Section
        title="Upload"
        actions={
          <div className="flex gap-2 items-center">
            <ConfirmButton
              className="text-sm"
              title="Delete upload?"
              description="This will also delete contacts created from this upload."
              confirmText="Delete"
              onConfirm={async () => {
                const res = await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
                if (!res.ok) { toast.error('Delete failed'); return; }
                toast.success('Upload deleted');
                window.location.href = '/uploads';
              }}
            >Delete</ConfirmButton>
            <Button onClick={() => router.back()} className="text-sm">Back</Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Input placeholder="Search email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => { setPage(1); load(); }}>Search</Button>
          <Button onClick={async () => {
            if (items.length === 0) return toast.error('No contacts to delete on this page');
            const ids = items.map((c: any) => c.id);
            if (!confirm(`Delete or unsubscribe ${ids.length} contacts from this upload page?`)) return;
            const res = await fetch('/api/contacts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
            const json = await res.json();
            toast.success(`Deleted: ${json.deleted}, Unsubscribed: ${json.unsubscribed}`);
            await load();
          }}>Delete page</Button>
          <Button onClick={async () => {
            if (selected.length === 0) return toast.error('Select contacts to delete');
            if (!confirm(`Delete or unsubscribe ${selected.length} selected contacts?`)) return;
            const res = await fetch('/api/contacts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }) });
            const json = await res.json();
            toast.success(`Deleted: ${json.deleted}, Unsubscribed: ${json.unsubscribed}`);
            setSelected([]);
            await load();
          }}>Delete selected</Button>
        </div>
        {upload && (
          <div className="text-sm text-gray-500 mb-3">{new Date(upload.created_at).toLocaleString()} • {upload.row_count} rows</div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2"><input type="checkbox" aria-label="Select all" checked={selected.length>0 && selected.length===items.length} onChange={(e)=> setSelected(e.target.checked ? items.map((c:any)=>c.id) : [])} /></th>
                <th className="p-2 text-left cursor-pointer" onClick={() => setSort(s => ({ key: 'email', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}>Email</th>
                <th className="p-2 text-left">first_name</th>
                <th className="p-2 text-left cursor-pointer" onClick={() => setSort(s => ({ key: 'created', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}>created</th>
              </tr>
            </thead>
            <tbody>
              {[...items].sort((a: any, b: any) => {
                if (sort.key === 'email') {
                  return sort.dir === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
                }
                const at = new Date(a.created_at).getTime();
                const bt = new Date(b.created_at).getTime();
                return sort.dir === 'asc' ? at - bt : bt - at;
              }).map((c: any) => (
                <tr key={c.id} className="border-t odd:bg-gray-50/40">
                  <td className="p-2"><input type="checkbox" aria-label="Select row" checked={selected.includes(c.id)} onChange={(e)=> setSelected(e.target.checked ? [...selected, c.id] : selected.filter(id=>id!==c.id))} /></td>
                  <td className="p-2">{c.email}</td>
                  <td className="p-2">{c.fields?.first_name || ''}</td>
                  <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={4} className="p-3 text-gray-500">No contacts.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-between text-sm text-gray-600">
          <div className="flex items-center gap-3 flex-wrap">
            <a href={`/api/uploads/${id}/export`} className="px-3 py-2 border rounded">Export CSV</a>
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
          </div>
          <div>Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
          <button disabled={page>=Math.ceil(total/pageSize)} onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      </Section>
    </div>
  );
}


