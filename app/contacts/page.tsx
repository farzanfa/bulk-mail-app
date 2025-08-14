"use client";
import { useEffect, useState } from 'react';

type Contact = { id: string; email: string; fields: Record<string, any>; unsubscribed: boolean; created_at: string };

export default function ContactsPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const pageSize = 50;

  async function load() {
    const res = await fetch(`/api/contacts?search=${encodeURIComponent(search)}&page=${page}`, { cache: 'no-store' });
    const json = await res.json();
    setItems(json.items || []);
    setTotal(json.total || 0);
    setSelected([]);
  }
  useEffect(() => { load(); }, [page]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <div className="flex gap-2">
          <input placeholder="Search email/name" className="border rounded p-2 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => { setPage(1); load(); }} className="px-3 py-2 border rounded text-sm">Search</button>
          <button disabled={selected.length === 0} onClick={async () => {
            if (!confirm(`Delete or unsubscribe ${selected.length} contacts?`)) return;
            const res = await fetch('/api/contacts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }) });
            const json = await res.json();
            alert(`Deleted: ${json.deleted}, Unsubscribed: ${json.unsubscribed}`);
            await load();
          }} className="px-3 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">Bulk delete</button>
        </div>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2"><input type="checkbox" checked={selected.length>0 && selected.length===items.length} onChange={(e) => setSelected(e.target.checked ? items.map(i=>i.id) : [])} /></th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-2"><input type="checkbox" checked={selected.includes(c.id)} onChange={(e)=> setSelected(e.target.checked ? [...selected, c.id] : selected.filter(x=>x!==c.id))} /></td>
                <td className="p-2">{c.email}</td>
                <td className="p-2">{c.fields?.first_name || ''}</td>
                <td className="p-2">{c.unsubscribed ? 'Unsubscribed' : 'Active'}</td>
                <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-3 text-gray-500">No contacts.</td></tr>
            )}
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


