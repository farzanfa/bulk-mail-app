"use client";
import { useState } from 'react';
import { Section, Input, Button, PrimaryButton, Card } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';

function extractVars(s: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
  const out = new Set<string>();
  for (const m of s.matchAll(re)) out.add(m[1]);
  return Array.from(out);
}

export function TemplateNewModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('<p>Hello {{ first_name }}</p>');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Extract variables from template content
  const vars = extractVars(subject + ' ' + html);

  // Sample data for preview rendering
  const sampleObj: Record<string, unknown> = {
    first_name: 'John',
    last_name: 'Doe',
    company: 'Acme Corp',
    email: 'john@example.com'
  };

  const render = (tpl: string) => {
    if (!tpl) return '';
    try {
      return sanitizeHtml(tpl.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (_, k) => String(sampleObj[k] ?? '')));
    } catch (err) {
      console.error('Error rendering template:', err);
      return tpl;
    }
  };

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) { 
      alert('Name and subject are required'); 
      return; 
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/templates', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name: name.trim(), subject: subject.trim(), html: html.trim(), text: text.trim() }) 
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save template: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.template) {
        alert('Template saved successfully');
        onClose();
        // Refresh the page to show the new template
        window.location.reload();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Failed to create template:', err);
      alert(err?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-card w-full max-w-3xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">New Template</div>
          <button aria-label="Close" className="p-2" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-4 max-h-[80vh] overflow-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-500 mb-1">Template name</div>
              <input 
                className="border rounded w-full p-2" 
                placeholder="Welcome Email" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
              />
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500 mb-1">Email subject</div>
              <input 
                className="border rounded w-full p-2" 
                placeholder="Welcome {{ first_name }}!" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                required
              />
            </Card>
          </div>
          
          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">HTML body</div>
            <textarea 
              className="border rounded w-full p-2 h-32 resize-none" 
              placeholder="<p>Hello {{ first_name }}, welcome to our service!</p>"
              value={html} 
              onChange={(e) => setHtml(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use variables like {'{{ first_name }}'}, {'{{ company }}'}, etc. for personalization
            </p>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500 mb-1">Plain text version (optional)</div>
            <textarea 
              className="border rounded w-full p-2 h-24 resize-none" 
              placeholder="Hello {{ first_name }}, welcome to our service!"
              value={text} 
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Plain text version for email clients that don't support HTML
            </p>
          </Card>

          {vars.length > 0 && (
            <Card className="p-4">
              <div className="text-sm text-gray-500 mb-2">Variables detected</div>
              <div className="flex flex-wrap gap-2">
                {vars.map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {v}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={onClose} className="flex-1">Cancel</Button>
            <PrimaryButton 
              disabled={!name.trim() || !subject.trim() || saving} 
              loading={saving} 
              onClick={onCreate} 
              className="flex-1 disabled:opacity-50"
            >
              Save Template
            </PrimaryButton>
          </div>

          {(subject || html) && (
            <Section title="Preview">
              <div className="font-medium mb-2">Preview (sample data)</div>
              <div className="divide-y">
                <div className="py-2">
                  <div className="text-sm text-gray-500">Subject:</div>
                  <div className="font-medium">{render(subject) || 'Preview will appear here'}</div>
                </div>
                <div className="py-2">
                  <div className="text-sm text-gray-500">HTML Body:</div>
                  <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: render(html) || '<p class="text-gray-400">Preview will appear here</p>' }} />
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
