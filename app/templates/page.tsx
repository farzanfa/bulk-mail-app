"use client";
import { useEffect, useMemo, useState } from 'react';

function extractVars(s: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
  const out = new Set<string>();
  for (const m of s.matchAll(re)) out.add(m[1]);
  return Array.from(out);
}

export default function TemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('<p>Hello {{ first_name }}</p>');
  const [text, setText] = useState('Hello {{ first_name }}');
  const [sample, setSample] = useState('{"first_name":"Ada"}');
  const vars = useMemo(() => Array.from(new Set([...extractVars(subject), ...extractVars(html), ...extractVars(text)])), [subject, html, text]);

  async function refresh() {
    const res = await fetch('/api/templates', { cache: 'no-store' });
    const json = await res.json();
    setItems(json.templates || []);
  }
  useEffect(() => { refresh(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, html, text }) });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Failed');
    setName('');
    await refresh();
  }

  let sampleObj: Record<string, unknown> = {};
  try { sampleObj = JSON.parse(sample); } catch {}
  const render = (tpl: string) => tpl.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, k) => String((sampleObj as any)[k] ?? ''));

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Templates</h1>
      <form onSubmit={onCreate} className="grid md:grid-cols-2 gap-4 bg-white p-4 rounded shadow">
        <div>
          <label className="text-sm text-gray-500">Name</label>
          <input className="border rounded w-full p-2 mb-2" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="text-sm text-gray-500">Subject</label>
          <input className="border rounded w-full p-2 mb-2" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <label className="text-sm text-gray-500">HTML</label>
          <textarea className="border rounded w-full p-2 h-32 mb-2" value={html} onChange={(e) => setHtml(e.target.value)} />
          <label className="text-sm text-gray-500">Text</label>
          <textarea className="border rounded w-full p-2 h-24" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="mt-3 bg-black text-white px-3 py-2 rounded">Save Template</button>
        </div>
        <div>
          <div className="text-sm text-gray-500">Variables detected</div>
          <div className="text-sm mb-3">{vars.join(', ') || 'None'}</div>
          <label className="text-sm text-gray-500">Sample data (JSON)</label>
          <textarea className="border rounded w-full p-2 h-24 mb-3" value={sample} onChange={(e) => setSample(e.target.value)} />
          <div className="text-sm text-gray-500 mb-1">Preview</div>
          <div className="border rounded p-3">
            <div className="text-sm text-gray-500">Subject</div>
            <div className="mb-2">{render(subject)}</div>
            <div className="text-sm text-gray-500">HTML</div>
            <div className="prose" dangerouslySetInnerHTML={{ __html: render(html) }} />
            <div className="text-sm text-gray-500 mt-2">Text</div>
            <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">{render(text)}</pre>
          </div>
        </div>
      </form>

      <div className="mt-6 bg-white rounded shadow divide-y">
        {items.map(t => (
          <a key={t.id} href={`/templates/${t.id}`} className="block p-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-gray-500">v{t.version} • {new Date(t.updated_at).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-600">{t.variables.length} vars</div>
            </div>
          </a>
        ))}
        {items.length === 0 && <div className="p-3 text-sm text-gray-500">No templates yet.</div>}
      </div>
    </div>
  );
}


