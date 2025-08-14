"use client";
import { useEffect, useState } from 'react';
import { Section, Input, Button } from '@/components/ui';
import { ConfirmButton } from '@/components/confirm';

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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <div className="flex gap-2">
          <Input placeholder="Search email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => { setPage(1); load(); }}>Search</Button>
          <ConfirmButton
            disabled={selected.length === 0}
            title="Delete or unsubscribe contacts?"
            description={`Selected: ${selected.length}. Contacts with campaign history will be unsubscribed; others deleted.`}
            confirmText="Proceed"
            onConfirm={async () => {
              const res = await fetch('/api/contacts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }) });
              const json = await res.json();
              alert(`Deleted: ${json.deleted}, Unsubscribed: ${json.unsubscribed}`);
              await load();
            }}
            className="bg-red-600 text-white"
          >Bulk delete</ConfirmButton>
        </div>
      </div>
      <Section title="All contacts">
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
              <tr key={c.id} className="border-t odd:bg-gray-50/40">
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
      </Section>
      <div className="mt-3 flex justify-between text-sm text-gray-600">
        <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
        <div>Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
        <button disabled={page>=Math.ceil(total/pageSize)} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );
}


