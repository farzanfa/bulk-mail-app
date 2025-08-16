"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Section, Card, Input, PrimaryButton, Button } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';

function extractVars(s: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
  const out = new Set<string>();
  for (const m of s.matchAll(re)) out.add(m[1]);
  return Array.from(out);
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const templateId = params.id;
  
  const [template, setTemplate] = useState<any>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Extract variables from template content
  const vars = extractVars(subject + ' ' + html);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  async function loadTemplate() {
    try {
      setLoading(true);
      const res = await fetch(`/api/templates/${templateId}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to load template: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.template) {
        setTemplate(json.template);
        setName(json.template.name || '');
        setSubject(json.template.subject || '');
        setHtml(json.template.html || '');
        setText(json.template.text || '');
        setVersion(json.template.version);
      } else {
        throw new Error('Invalid template data received');
      }
    } catch (err: any) {
      console.error('Failed to load template:', err);
      toast.error(err?.message || 'Failed to load template');
      router.push('/templates');
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) { 
      toast.error('Name and subject are required'); 
      return; 
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          name: name.trim(), 
          subject: subject.trim(), 
          html: html.trim(), 
          text: text.trim() 
        }) 
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update template: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.template) {
        toast.success('Template updated successfully');
        // Update local state with new template data
        setTemplate(json.template);
        setVersion(json.template.version);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Failed to update template:', err);
      toast.error(err?.message || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteTemplate() {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete template: ${res.status}`);
      }
      
      toast.success('Template deleted successfully');
      router.push('/templates');
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      toast.error(err?.message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Template Not Found</h3>
            <p className="text-gray-600 mb-4">The template you're looking for doesn't exist or has been deleted.</p>
            <a href="/templates" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200">
              Back to Templates
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <a
                href="/templates"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Templates
              </a>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Template</h1>
                <p className="text-gray-600">
                  {version ? `Version ${version}` : 'Update your template'} • 
                  <span className="text-purple-600 font-medium ml-1"> This will create a new version</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onDeleteTemplate}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                {deleting ? 'Deleting...' : 'Delete Template'}
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={onUpdateTemplate} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <Input 
                  className="w-full" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g., Welcome Email, Newsletter Template"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                <Input 
                  className="w-full" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="e.g., Welcome {{ first_name }}!"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HTML Body</label>
                <textarea 
                  className="border border-gray-300 rounded-lg w-full p-4 h-64 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none font-mono text-sm" 
                  value={html} 
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<p>Hello {{ first_name }}, welcome to our service!</p>"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use variables like {'{{ first_name }}'}, {'{{ company }}'}, etc. for personalization
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plain Text Version (Optional)</label>
                <textarea 
                  className="border border-gray-300 rounded-lg w-full p-4 h-32 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none font-mono text-sm" 
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Hello {{ first_name }}, welcome to our service!"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Plain text version for email clients that don't support HTML
                </p>
              </div>
            </div>

            {/* Right Column - Preview & Variables */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Variables Detected</h3>
                {vars.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vars.map((v, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No variables detected yet</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
                <Card className="p-4 border-2 border-gray-200">
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Subject:</div>
                    <div className="text-gray-900 bg-gray-50 rounded px-3 py-2 border text-sm">
                      {render(subject) || 'Preview will appear here'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">HTML Body:</div>
                    <div className="bg-white border rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: render(html) || '<p class="text-gray-400">Preview will appear here</p>' }} />
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Form Actions */}
            <div className="lg:col-span-2 border-t border-gray-200 bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button 
                  type="button" 
                  onClick={() => router.push('/templates')}
                  className="w-full sm:w-auto px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white font-medium"
                >
                  Cancel
                </Button>
                <PrimaryButton 
                  type="submit" 
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save (New Version)'
                  )}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
