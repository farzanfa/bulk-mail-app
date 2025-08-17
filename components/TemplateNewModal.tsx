"use client";
import { useState } from 'react';
import { Section, Input, Button, PrimaryButton, Card, Textarea } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';

function extractVars(s: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
  const out = new Set<string>();
  for (const m of s.matchAll(re)) out.add(m[1]);
  return Array.from(out);
}

interface TemplateNewModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function TemplateNewModal({ onClose, onSuccess }: TemplateNewModalProps) {
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
        
        // Handle plan limit error specifically
        if (res.status === 402 && errorData.upgradeRequired) {
          if (confirm(errorData.error + '\n\nWould you like to view upgrade options?')) {
            window.location.href = '/pricing';
          }
          return;
        }
        
        throw new Error(errorData.error || `Failed to save template: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.template) {
        alert('Template saved successfully');
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 mx-auto">
        <div className="sticky top-0 z-10 bg-white p-4 border-b flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg font-semibold">New Template</h2>
          <button 
            aria-label="Close" 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target flex items-center justify-center" 
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={onCreate} className="p-4 space-y-4 modal-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <label className="block text-sm text-gray-500 mb-2">Template name</label>
              <Input 
                type="text"
                placeholder="Welcome Email" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
              />
            </Card>
            <Card className="p-4">
              <label className="block text-sm text-gray-500 mb-2">Email subject</label>
              <Input 
                type="text"
                placeholder="Welcome {{ first_name }}!" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                required
              />
            </Card>
          </div>
          
          <Card className="p-4">
            <label className="block text-sm text-gray-500 mb-2">HTML body</label>
            <Textarea 
              rows={8}
              placeholder="<p>Hello {{ first_name }}, welcome to our service!</p>"
              value={html} 
              onChange={(e) => setHtml(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Use variables like {'{{ first_name }}'}, {'{{ company }}'}, etc. for personalization
            </p>
          </Card>

          <Card className="p-4">
            <label className="block text-sm text-gray-500 mb-2">Plain text version (optional)</label>
            <Textarea 
              rows={6}
              placeholder="Hello {{ first_name }}, welcome to our service!"
              value={text} 
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Plain text version for email clients that don't support HTML
            </p>
          </Card>

          {vars.length > 0 && (
            <Card className="p-4">
              <div className="text-sm text-gray-500 mb-3">Variables detected</div>
              <div className="flex flex-wrap gap-2">
                {vars.map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {v}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="button" onClick={onClose} className="flex-1">Cancel</Button>
            <PrimaryButton 
              type="submit"
              disabled={!name.trim() || !subject.trim() || saving} 
              loading={saving} 
              className="flex-1 disabled:opacity-50"
            >
              Save Template
            </PrimaryButton>
          </div>

          {(subject || html) && (
            <Section title="Preview">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500 mb-1">Subject:</div>
                  <div className="font-medium">{render(subject) || 'Preview will appear here'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">HTML Body:</div>
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: render(html) || '<p class="text-gray-400">Preview will appear here</p>' }} />
                </div>
              </div>
            </Section>
          )}
        </form>
      </div>
    </div>
  );
}
