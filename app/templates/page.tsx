"use client";
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Section, Card, Input, PrimaryButton } from '@/components/ui';

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
    if (!res.ok) { toast.error(json.error || 'Failed'); return; }
    setName('');
    await refresh();
    toast.success('Template saved');
  }

  let sampleObj: Record<string, unknown> = {};
  try { sampleObj = JSON.parse(sample); } catch {}
  const render = (tpl: string) => tpl.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, k) => String((sampleObj as any)[k] ?? ''));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Templates</h1>
      <Section title="Create template">
        <form onSubmit={onCreate} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            <Input className="w-full mb-2" value={name} onChange={(e) => setName(e.target.value)} required />
            <label className="text-sm text-gray-500">Subject</label>
            <Input className="w-full mb-2" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <label className="text-sm text-gray-500">HTML</label>
            <textarea className="border rounded w-full p-2 h-40 sm:h-48 mb-2" value={html} onChange={(e) => setHtml(e.target.value)} />
            <label className="text-sm text-gray-500">Text</label>
            <textarea className="border rounded w-full p-2 h-28 sm:h-32" value={text} onChange={(e) => setText(e.target.value)} />
            <PrimaryButton className="mt-3">Save Template</PrimaryButton>
          </div>
          <div>
            <div className="text-sm text-gray-500">Variables detected</div>
            <div className="text-sm mb-3">{vars.join(', ') || 'None'}</div>
            <label className="text-sm text-gray-500">Sample data (JSON)</label>
            <textarea className="border rounded w-full p-2 h-28 sm:h-32 mb-3" value={sample} onChange={(e) => setSample(e.target.value)} />
            <div className="text-sm text-gray-500 mb-1">Preview</div>
            <Card className="p-3 overflow-x-auto">
              <div className="text-sm text-gray-500">Subject</div>
              <div className="mb-2">{render(subject)}</div>
              <div className="text-sm text-gray-500">HTML</div>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: render(html) }} />
              <div className="text-sm text-gray-500 mt-2">Text</div>
              <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">{render(text)}</pre>
            </Card>
          </div>
        </form>
      </Section>

      <Section title="Your templates">
        <div className="divide-y">
          {items.map(t => (
            <a key={t.id} href={`/templates/${t.id}`} className="block p-3 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
      </Section>
    </div>
  );
}



