"use client";
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Section, Card, Input, PrimaryButton, Button } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';

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
  const [savingCreate, setSavingCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [editVersion, setEditVersion] = useState<number | undefined>(undefined);
  const [savingEdit, setSavingEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const vars = useMemo(() => Array.from(new Set([...extractVars(subject), ...extractVars(html)])), [subject, html]);

  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch('/api/templates', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch templates: ${res.status}`);
      }
      const json = await res.json();
      setItems(json.templates || []);
    } catch (err: any) {
      console.error('Failed to refresh templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) { 
      toast.error('Name and subject are required'); 
      return; 
    }
    
    setSavingCreate(true);
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
        toast.success('Template saved successfully');
        setName('');
        setSubject('');
        setHtml('<p>Hello {{ first_name }}</p>');
        setText('');
        setOpenCreate(false);
        await refresh();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Failed to create template:', err);
      toast.error(err?.message || 'Failed to save template');
    } finally {
      setSavingCreate(false);
    }
  }

  async function onEditTemplate(templateId: string) {
    try {
      const res = await fetch(`/api/templates/${templateId}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to load template: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.template) {
        setEditId(json.template.id);
        setEditName(json.template.name || '');
        setEditSubject(json.template.subject || '');
        setEditHtml(json.template.html || '');
        setEditVersion(json.template.version);
        setOpenEdit(true);
      } else {
        throw new Error('Invalid template data received');
      }
    } catch (err: any) {
      console.error('Failed to load template for editing:', err);
      toast.error(err?.message || 'Failed to load template');
    }
  }

  async function onUpdateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editName.trim() || !editSubject.trim()) { 
      toast.error('Name and subject are required'); 
      return; 
    }
    
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/templates/${editId}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          name: editName.trim(), 
          subject: editSubject.trim(), 
          html: editHtml.trim(), 
          text: '' 
        }) 
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update template: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.template) {
        toast.success('Template updated successfully');
        setOpenEdit(false);
        await refresh();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Failed to update template:', err);
      toast.error(err?.message || 'Failed to update template');
    } finally {
      setSavingEdit(false);
    }
  }

  async function onDeleteTemplate(templateId: string) {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete template: ${res.status}`);
      }
      
      toast.success('Template deleted successfully');
      setOpenEdit(false);
      await refresh();
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      toast.error(err?.message || 'Failed to delete template');
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



  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Email Templates
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl mx-auto sm:mx-0">
              Create and manage your email templates with personalized variables
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <PrimaryButton 
              onClick={() => setOpenCreate(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">New Template</span>
              <span className="sm:hidden">New</span>
            </PrimaryButton>
          </div>
        </div>

        {/* Templates Grid */}
        <Section title="Your Templates">
          {loading ? (
            <Card className="p-8 sm:p-16 text-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading templates...</p>
            </Card>
          ) : items.length === 0 ? (
            <Card className="p-8 sm:p-16 text-center bg-gradient-to-br from-white to-purple-50 border-purple-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                Create your first email template to start building personalized campaigns. 
                Templates support variables like {'{{ first_name }}'} for dynamic content.
              </p>
              <PrimaryButton 
                onClick={() => setOpenCreate(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Create Your First Template</span>
                <span className="sm:hidden">Create Template</span>
              </PrimaryButton>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {items.map((t) => (
                <button 
                  key={t.id} 
                  type="button" 
                  onClick={() => onEditTemplate(t.id)}
                  className="block text-left group w-full"
                >
                  <Card className="p-4 sm:p-6 h-full hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-transparent group-hover:border-purple-200">
                    {/* Template Header */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-base sm:text-lg font-semibold text-gray-900 truncate mb-1 group-hover:text-purple-600 transition-colors">
                          {t.name || 'Untitled Template'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          v{t.version || 1} • {new Date(t.updated_at || t.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full whitespace-nowrap">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {Array.isArray(t.variables) ? t.variables.length : 0} vars
                        </span>
                      </div>
                    </div>

                    {/* Subject Preview */}
                    <div className="mb-3 sm:mb-4">
                      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Subject</div>
                      <div className="text-xs sm:text-sm text-gray-700 bg-gray-50 rounded px-2 sm:px-3 py-1.5 sm:py-2 border truncate">
                        {render(t.subject || '') || 'No subject'}
                      </div>
                    </div>

                    {/* HTML Preview */}
                    <div className="mb-3 sm:mb-4">
                      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Preview</div>
                      <div className="relative">
                        <div className="w-full h-28 sm:h-36 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <div className="p-3 sm:p-4 h-full overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                            {t.html ? (
                              <div className="h-full flex items-center justify-center">
                                <div className="w-full max-w-xs transform scale-90 origin-center">
                                  <div
                                    className="prose prose-sm max-w-none text-gray-800"
                                    dangerouslySetInnerHTML={{ 
                                      __html: render(t.html) || '<p class="text-gray-400 text-center">No content</p>' 
                                    }} 
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                  </svg>
                                  <p className="text-xs">No HTML content</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Subtle overlay for better readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none rounded-lg"></div>
                        {/* Preview indicator */}
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Click to edit</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Create Template Modal */}
        {openCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Template</h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">Design your email template with personalized variables</p>
                  </div>
                  <button 
                    aria-label="Close" 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                    onClick={() => setOpenCreate(false)}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6">
                <form onSubmit={onCreate} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Left Column - Form Fields */}
                  <div className="space-y-4 sm:space-y-6">
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
                        className="border border-gray-300 rounded-lg w-full p-3 h-32 sm:h-48 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none" 
                        value={html} 
                        onChange={(e) => setHtml(e.target.value)}
                        placeholder="<p>Hello {{ first_name }}, welcome to our service!</p>"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use variables like {'{{ first_name }}'}, {'{{ company }}'}, etc. for personalization
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Preview & Variables */}
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Variables Detected</h3>
                      {vars.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {vars.map((v, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1 bg-purple-100 text-purple-700 text-xs sm:text-sm font-medium rounded-full">
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
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Preview</h3>
                      <Card className="p-3 sm:p-4 border-2 border-gray-200">
                        <div className="mb-3 sm:mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Subject:</div>
                          <div className="text-gray-900 bg-gray-50 rounded px-2 sm:px-3 py-1.5 sm:py-2 border text-sm">
                            {render(subject) || 'Preview will appear here'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">HTML Body:</div>
                          <div className="bg-white border rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto">
                            <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: render(html) || '<p class="text-gray-400">Preview will appear here</p>' }} />
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="lg:col-span-2 border-t border-gray-200 bg-gray-50 p-3 sm:p-4 rounded-lg">
                    {/* Button Container - Improved Responsiveness */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                      <Button 
                        type="button" 
                        onClick={() => setOpenCreate(false)}
                        className="w-full sm:w-auto px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white font-medium"
                      >
                        Cancel
                      </Button>
                      <PrimaryButton 
                        type="submit" 
                        disabled={savingCreate}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {savingCreate ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                          </div>
                          ) : (
                            'Save Template'
                          )}
                      </PrimaryButton>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

                {/* Edit Template Modal */}
        {openEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Template</h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      {editVersion ? `Version ${editVersion}` : 'Update your template'} • 
                      <span className="text-purple-600 font-medium"> This will create a new version</span>
                    </p>
                  </div>
                  <button 
                    aria-label="Close" 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                    onClick={() => setOpenEdit(false)}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6">
                <form onSubmit={onUpdateTemplate} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Left Column - Form Fields */}
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                      <Input 
                        className="w-full" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                      <Input 
                        className="w-full" 
                        value={editSubject} 
                        onChange={(e) => setEditSubject(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">HTML Body</label>
                      <textarea 
                        className="border border-gray-300 rounded-lg w-full p-3 h-32 sm:h-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none" 
                        value={editHtml} 
                        onChange={(e) => setEditHtml(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Right Column - Preview */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Preview</h3>
                    <Card className="p-3 sm:p-4 border-2 border-gray-200">
                      <div className="mb-3 sm:mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Subject:</div>
                        <div className="text-gray-900 bg-gray-50 rounded px-2 sm:px-3 py-1.5 sm:py-2 border text-sm">
                          {editSubject || 'No subject'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">HTML Body:</div>
                        <div className="bg-white border rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto">
                          <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(editHtml || '') || '<p class="text-gray-400">No content</p>' }} />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Form Actions */}
                  <div className="lg:col-span-2 border-t border-gray-200 bg-gray-50 p-3 sm:p-4 rounded-lg">
                    {/* Button Container - Improved Responsiveness */}
                    <div className="flex flex-col gap-3">
                      {/* Delete Button - Full Width on Mobile */}
                      <button 
                        type="button" 
                        className="w-full sm:w-auto text-sm text-red-600 hover:text-red-700 font-medium px-4 py-3 rounded-lg hover:bg-red-50 transition-colors bg-white border border-red-200 flex items-center justify-center sm:justify-start"
                        onClick={() => onDeleteTemplate(editId)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Template
                      </button>
                      
                      {/* Action Buttons - Stack on Mobile, Side by Side on Desktop */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          type="button" 
                          onClick={() => setOpenEdit(false)}
                          className="w-full sm:w-auto px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white font-medium"
                        >
                          Cancel
                        </Button>
                        <PrimaryButton 
                          type="submit" 
                          disabled={savingEdit}
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {savingEdit ? (
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
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



