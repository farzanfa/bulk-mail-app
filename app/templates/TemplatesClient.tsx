"use client";
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Section, Card, Input, PrimaryButton, Button } from '@/components/ui';
import { sanitizeHtml } from '@/lib/sanitize';
import ConfirmModal from '@/components/ConfirmModal';
import { TemplateNewModal } from '@/components/TemplateNewModal';

function extractVars(s: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;
  const out = new Set<string>();
  for (const m of s.matchAll(re)) out.add(m[1]);
  return Array.from(out);
}

interface PlanLimits {
  used: number;
  total: number;
  remaining: number;
}

interface PlanInfo {
  type: string;
  name: string;
  isSubscribed: boolean;
}

export default function TemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [openView, setOpenView] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch('/api/templates', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch templates: ${res.status}`);
      }
      const json = await res.json();
      setItems(json.templates || []);
      setPlanLimits(json.limits || null);
      setPlanInfo(json.plan || null);
    } catch (err: any) {
      console.error('Failed to refresh templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

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
      await refresh();
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      toast.error(err?.message || 'Failed to delete template');
    }
  }

  async function bulkDelete() {
    if (selected.length === 0) return;
    
    setDeleteMessage(`Are you sure you want to delete ${selected.length} template(s)? This action cannot be undone.`);
    setDeleteAction(() => async () => {
      try {
        let deletedCount = 0;
        for (const templateId of selected) {
          const res = await fetch(`/api/templates/${templateId}`, { method: 'DELETE' });
          if (res.ok) {
            deletedCount++;
          }
        }
        
        toast.success(`Successfully deleted ${deletedCount} template(s)`);
        setSelected([]);
        await refresh();
      } catch (err: any) {
        console.error('Bulk delete failed:', err);
        toast.error('Delete failed');
      }
    });
    setShowDeleteModal(true);
  }

  async function openTemplateModal(templateId: string) {
    try {
      const res = await fetch(`/api/templates/${templateId}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to load template: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.template) {
        setCurrentTemplate(json.template);
        setOpenView(true);
      } else {
        throw new Error('Invalid template data received');
      }
    } catch (err: any) {
      console.error('Failed to load template:', err);
      toast.error(err?.message || 'Failed to load template');
    }
  }

  // Filter templates based on search term
  const filteredTemplates = items.filter(template => 
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Select all filtered templates
  const selectAll = () => {
    if (selected.length === filteredTemplates.length) {
      setSelected([]);
    } else {
      setSelected(filteredTemplates.map(t => t.id));
    }
  };

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

  const canCreateTemplate = useMemo(() => {
    if (!planLimits) return true;
    return planLimits.remaining === -1 || planLimits.remaining > 0;
  }, [planLimits]);

  const handleCreateClick = () => {
    if (!canCreateTemplate) {
      setShowUpgradeModal(true);
      return;
    }
    setOpenCreate(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section with consistent styling */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeInUp">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Email Templates
                </h1>
                {planInfo && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    planInfo.type === 'admin' 
                      ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200' 
                      : planInfo.type === 'pro' || planInfo.isSubscribed
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200'
                      : planInfo.type === 'beta'
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {planInfo.name} Plan
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                Create and manage your email templates with personalized variables
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <PrimaryButton 
                onClick={handleCreateClick}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 ${
                  canCreateTemplate 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
                disabled={!canCreateTemplate}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Template
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Plan Limits Display */}
        {planLimits && planLimits.total !== -1 && (
          <Card className="p-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-100 animate-fadeInUp" style={{ animationDelay: '50ms' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Template Usage</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You've used {planLimits.used} of {planLimits.total} templates in your plan
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (planLimits.used / planLimits.total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round((planLimits.used / planLimits.total) * 100)}%
                  </span>
                </div>
                {planLimits.remaining === 0 && (
                  <Button
                    onClick={() => window.location.href = '/pricing'}
                    className="text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Search and Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={selectAll}
                className="px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-purple-300 hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{selected.length === filteredTemplates.length ? 'Deselect All' : 'Select All'}</span>
                </div>
              </Button>
              
              <button
                onClick={bulkDelete}
                disabled={selected.length === 0}
                className={`px-5 py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
                  selected.length === 0 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>
                    {selected.length === 0 
                      ? 'Delete' 
                      : `Delete (${selected.length})`
                    }
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <Section title="Your Templates">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="p-16 text-center bg-gradient-to-br from-gray-50 to-white">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm 
                  ? `No templates match "${searchTerm}". Try a different search term.`
                  : 'Create your first email template to start building personalized campaigns. Templates support variables like {{ first_name }} for dynamic content.'
                }
              </p>
              {!searchTerm && (
                <PrimaryButton 
                  onClick={handleCreateClick}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${
                    canCreateTemplate 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  } text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
                  disabled={!canCreateTemplate}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Template
                </PrimaryButton>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="group relative"
                  onClick={() => openTemplateModal(t.id)}
                >
                  <Card className="h-full p-6 cursor-pointer bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-purple-200">
                    {/* Template Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <label 
                          className="inline-flex items-center gap-2 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input 
                            type="checkbox" 
                            checked={selected.includes(t.id)} 
                            onChange={(e) => setSelected(e.target.checked ? [...selected, t.id] : selected.filter(x => x !== t.id))} 
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 transition-all"
                          />
                          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                            {t.name || 'Untitled Template'}
                          </h3>
                        </label>
                      </div>
                      <div className="ml-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          v{t.version || 1}
                        </span>
                      </div>
                    </div>

                    {/* Subject Preview */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        SUBJECT LINE
                      </div>
                      <div className="text-sm text-gray-700 bg-gradient-to-br from-gray-50 to-white rounded-lg px-3 py-2 border border-gray-200 truncate">
                        {render(t.subject || '') || 'No subject'}
                      </div>
                    </div>

                    {/* Variables Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        VARIABLES ({Array.isArray(t.variables) ? t.variables.length : 0})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(t.variables) && t.variables.length > 0 ? (
                          t.variables.slice(0, 3).map((v: string, i: number) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-md">
                              {v}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No variables</span>
                        )}
                        {Array.isArray(t.variables) && t.variables.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                            +{t.variables.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Template Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-900">Created</span>
                        </div>
                        <p className="text-xs text-blue-700">
                          {new Date(t.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      {t.updated_at && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-xs font-medium text-green-900">Updated</span>
                          </div>
                          <p className="text-xs text-green-700">
                            {new Date(t.updated_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/templates/${t.id}/edit`;
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTemplate(t.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>

                    {/* Hover indicator - removed as we have border on hover */}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Create Template Modal */}
        {openCreate && (
          <TemplateNewModal onClose={() => setOpenCreate(false)} onSuccess={refresh} />
        )}

        {/* Template Details Modal */}
        {openView && currentTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-fadeInUp">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 truncate">{currentTemplate.name || 'Untitled Template'}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 text-sm font-semibold rounded-full border border-purple-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Version {currentTemplate.version || 1}
                      </span>
                      <span className="text-sm text-gray-500">
                        Created {new Date(currentTemplate.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <a
                      href={`/templates/${currentTemplate.id}/edit`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Template
                    </a>
                    <button 
                      aria-label="Close" 
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                      onClick={() => setOpenView(false)}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Template Information & Variables */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Template Info Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Template Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Template ID</label>
                          <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-100 rounded px-3 py-2">{currentTemplate.id}</p>
                        </div>
                        {currentTemplate.updated_at && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {new Date(currentTemplate.updated_at).toLocaleDateString('en-US', { 
                                year: 'numeric',
                                month: 'long', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Variables Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Variables ({currentTemplate.variables?.length || 0})
                      </h3>
                      {currentTemplate.variables && currentTemplate.variables.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentTemplate.variables.map((v: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No variables detected in this template</p>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Actions
                      </h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentTemplate.id);
                            toast.success('Template ID copied to clipboard');
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          Copy Template ID
                        </button>
                        <button
                          onClick={() => {
                            const templateData = JSON.stringify({
                              name: currentTemplate.name,
                              subject: currentTemplate.subject,
                              html: currentTemplate.html,
                              text: currentTemplate.text
                            }, null, 2);
                            navigator.clipboard.writeText(templateData);
                            toast.success('Template data copied to clipboard');
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          Copy Template Data
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Preview */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Subject Preview */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Subject Line Preview
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                          <p className="text-gray-900 font-medium">
                            {render(currentTemplate.subject) || <span className="text-gray-400 italic">No subject</span>}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* HTML Preview */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          HTML Content Preview
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: render(currentTemplate.html) || '<p class="text-gray-400 italic">No HTML content</p>' }} />
                        </div>
                      </div>
                    </div>

                    {/* Plain Text Preview (if available) */}
                    {currentTemplate.text && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Plain Text Preview
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm whitespace-pre-wrap">
                            {render(currentTemplate.text)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            if (deleteAction) deleteAction();
            setShowDeleteModal(false);
          }}
          title="Delete Templates"
          message={deleteMessage}
          confirmText="Delete"
          variant="danger"
        />

        {/* Upgrade Plan Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Template Limit Reached</h3>
                      <p className="text-sm text-gray-600 mt-1">Upgrade to create more templates</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Current Usage</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {planLimits?.used} / {planLimits?.total}
                      </p>
                      <p className="text-sm text-gray-500">Templates</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">You need</p>
                      <p className="text-2xl font-bold text-purple-600">Unlimited</p>
                      <p className="text-sm text-gray-500">Templates</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">
                    You've reached the maximum number of templates for your current plan. 
                    Upgrade to a premium plan to create unlimited templates and unlock additional features.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited email templates
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced analytics & reporting
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Priority support
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Maybe Later
                  </Button>
                  <PrimaryButton
                    onClick={() => window.location.href = '/pricing'}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    View Plans
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



