"use client";
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Section, Card, Input, PrimaryButton, Button } from '@/components/ui';

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
  const [text, setText] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const vars = useMemo(() => Array.from(new Set([...extractVars(subject), ...extractVars(html)])), [subject, html]);

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
    setSubject('');
    setHtml('<p>Hello {{ first_name }}</p>');
    setText('');
    await refresh();
    toast.success('Template saved');
    setOpenCreate(false);
  }

  let sampleObj: Record<string, unknown> = {};
  const render = (tpl: string) => tpl.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, k) => String((sampleObj as any)[k] ?? ''));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Templates</h1>
      {/* Create New Template button opens modal */}

      <Section
        title="Your templates"
        actions={<PrimaryButton onClick={() => setOpenCreate(true)}>New Template</PrimaryButton>}
      >
        
        {items.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No templates yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((t) => (
              <a key={t.id} href={`/templates/${t.id}`} className="block">
                <Card className="p-3 h-full hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-sm font-medium truncate max-w-[12rem] sm:max-w-[9rem]">{t.name}</div>
                      <div className="text-[11px] text-gray-500">v{t.version} • {new Date(t.updated_at).toLocaleString()}</div>
                    </div>
                    <span className="text-[10px] text-gray-700 bg-gray-100 rounded px-1.5 py-0.5 whitespace-nowrap flex-shrink-0">{t.variables.length} vars</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mb-1">Preview</div>
                  <div className="rounded border bg-white">
                    <div className="px-2 py-1.5 border-b text-xs font-medium truncate">{render(t.subject || '')}</div>
                    <div className="p-2">
                      <div className="prose max-w-none text-xs max-h-24 overflow-hidden" dangerouslySetInnerHTML={{ __html: render(t.html || '') }} />
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}
      </Section>

      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-card w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Create template</div>
              <button aria-label="Close" className="p-2" onClick={() => setOpenCreate(false)}>✕</button>
            </div>
            <div className="p-4">
              <form onSubmit={onCreate} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Template name</label>
                  <Input className="w-full mb-2" value={name} onChange={(e) => setName(e.target.value)} required />
                  <label className="text-sm text-gray-500">Subject</label>
                  <Input className="w-full mb-2" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                  <label className="text-sm text-gray-500">Body HTML</label>
                  <textarea className="border rounded w-full p-2 h-40 sm:h-48 mb-2" value={html} onChange={(e) => setHtml(e.target.value)} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Variables detected</div>
                  <div className="text-sm mb-3">{vars.join(', ') || 'None'}</div>
                  <div className="text-sm text-gray-500 mb-1">Preview</div>
                  <Card className="p-3 overflow-x-auto">
                    <div className="text-sm text-gray-500">Subject</div>
                    <div className="mb-2">{render(subject)}</div>
                    <div className="text-sm text-gray-500">HTML</div>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: render(html) }} />
                  </Card>
                </div>
                <div className="lg:col-span-2 flex items-center justify-end gap-2">
                  <Button type="button" onClick={() => setOpenCreate(false)}>Cancel</Button>
                  <PrimaryButton type="submit">Save Template</PrimaryButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



