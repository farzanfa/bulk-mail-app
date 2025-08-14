"use client";
import { useEffect, useState } from 'react';

export default function TemplateDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [t, setT] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/templates/${id}`, { cache: 'no-store' });
      const json = await res.json();
      setT(json.template);
      setName(json.template.name);
      setSubject(json.template.subject);
      setHtml(json.template.html);
      setText(json.template.text);
    })();
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, html, text }) });
      if (!res.ok) throw new Error('Save failed');
      const json = await res.json();
      setT(json.template);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm('Delete this template?')) return;
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    if (res.ok) window.location.href = '/templates';
  }

  if (!t) return <div className="max-w-3xl mx-auto p-6">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Edit Template</h1>
        <button onClick={onDelete} className="text-sm text-red-600">Delete</button>
      </div>
      <form onSubmit={onSave} className="grid md:grid-cols-2 gap-4 bg-white p-4 rounded shadow">
        <div>
          <label className="text-sm text-gray-500">Name</label>
          <input className="border rounded w-full p-2 mb-2" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="text-sm text-gray-500">Subject</label>
          <input className="border rounded w-full p-2 mb-2" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <label className="text-sm text-gray-500">HTML</label>
          <textarea className="border rounded w-full p-2 h-32 mb-2" value={html} onChange={(e) => setHtml(e.target.value)} />
          <label className="text-sm text-gray-500">Text</label>
          <textarea className="border rounded w-full p-2 h-24" value={text} onChange={(e) => setText(e.target.value)} />
          <button disabled={busy} className="mt-3 bg-black text-white px-3 py-2 rounded">{busy ? 'Saving…' : 'Save (new version)'}</button>
        </div>
        <div>
          <div className="text-sm text-gray-500">Current version</div>
          <div className="text-sm mb-3">v{t.version}</div>
          <div className="text-sm text-gray-500 mb-1">Preview</div>
          <div className="border rounded p-3">
            <div className="text-sm text-gray-500">Subject</div>
            <div className="mb-2">{subject}</div>
            <div className="text-sm text-gray-500">HTML</div>
            <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="text-sm text-gray-500 mt-2">Text</div>
            <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">{text}</pre>
          </div>
        </div>
      </form>
    </div>
  );
}



