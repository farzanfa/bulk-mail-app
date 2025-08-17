"use client";
import { useState } from 'react';
import { Section, Input, Button, PrimaryButton, Card, Textarea } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';
import { toast } from 'sonner';

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
      toast.error('Name and subject are required'); 
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
        toast.success('Template saved successfully');
        
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
      toast.error(err?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create New Template</h2>
              <p className="text-gray-600 mt-1">Design a reusable email template with dynamic variables</p>
            </div>
            <button 
              aria-label="Close" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              onClick={onClose}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <form onSubmit={onCreate} className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <Input 
                  type="text"
                  placeholder="e.g., Welcome Email, Monthly Newsletter" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Give your template a descriptive name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject <span className="text-red-500">*</span>
                </label>
                <Input 
                  type="text"
                  placeholder="e.g., Welcome to {{ company }}, {{ first_name }}!" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Use {'{{ variable }}'} syntax for personalization</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content <span className="text-red-500">*</span>
                </label>
                <Textarea 
                  rows={10}
                  placeholder="<p>Hello {{ first_name }},</p>
<p>Welcome to {{ company }}! We're excited to have you on board.</p>"
                  value={html} 
                  onChange={(e) => setHtml(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Write your email content using HTML tags
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plain Text Version <span className="text-gray-400">(Optional)</span>
                </label>
                <Textarea 
                  rows={6}
                  placeholder="Hello {{ first_name }},

Welcome to {{ company }}! We're excited to have you on board."
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fallback for email clients that don't support HTML
                </p>
              </div>
            </div>

            {/* Right Column - Preview & Variables */}
            <div className="space-y-6">
              {/* Variables Detected */}
              {vars.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Variables Detected ({vars.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {vars.map((v, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        {v}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    These variables will be replaced with actual data when sending emails
                  </p>
                </div>
              )}

              {/* Live Preview */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Live Preview
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {/* Subject Preview */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Line</label>
                    <div className="mt-2 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <p className="text-gray-900 font-medium">
                        {render(subject) || <span className="text-gray-400 italic">Subject preview will appear here</span>}
                      </p>
                    </div>
                  </div>

                  {/* HTML Preview */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">HTML Content</label>
                    <div className="mt-2 bg-white border border-gray-200 rounded-lg p-6 max-h-64 overflow-y-auto">
                      <div className="prose prose-sm max-w-none" 
                        dangerouslySetInnerHTML={{ 
                          __html: render(html) || '<p class="text-gray-400 italic">HTML preview will appear here</p>' 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Data Info */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Preview Data
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  The preview uses this sample data:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">first_name</code>
                    <span className="text-gray-500">→</span>
                    <span className="font-medium">John</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">last_name</code>
                    <span className="text-gray-500">→</span>
                    <span className="font-medium">Doe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">company</code>
                    <span className="text-gray-500">→</span>
                    <span className="font-medium">Acme Corp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">email</code>
                    <span className="text-gray-500">→</span>
                    <span className="font-medium">john@example.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              onClick={onClose} 
              className="w-full sm:w-auto px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white font-medium"
            >
              Cancel
            </Button>
            <PrimaryButton 
              type="submit"
              disabled={!name.trim() || !subject.trim() || saving} 
              loading={saving} 
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Template'
              )}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
