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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Email Templates
              </h1>
              {planInfo && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  planInfo.type === 'admin' 
                    ? 'bg-red-100 text-red-800 border border-red-200' 
                    : planInfo.type === 'pro' || planInfo.isSubscribed
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200'
                    : planInfo.type === 'beta'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {planInfo.name} Plan
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto sm:mx-0">
              Create and manage your email templates with personalized variables
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <PrimaryButton 
              onClick={handleCreateClick}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 ${
                canCreateTemplate 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base`}
              disabled={!canCreateTemplate}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">New Template</span>
              <span className="sm:hidden">New</span>
            </PrimaryButton>
          </div>
        </div>

        {/* Plan Limits Display */}
        {planLimits && planLimits.total !== -1 && (
          <Card className="p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
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
                    className="text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                  >
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
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
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={selectAll}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-white font-medium rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{selected.length === filteredTemplates.length ? 'Deselect All' : 'Select All'}</span>
              </div>
            </Button>
            
            <button
              onClick={bulkDelete}
              disabled={selected.length === 0}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 ${
                selected.length === 0 
                  ? 'bg-gray-400 text-gray-200 border-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white border-red-700 hover:shadow-red-500/25'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>
                  {selected.length === 0 
                    ? 'No Templates Selected' 
                    : `Delete Selected (${selected.length})`
                  }
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <Section title="Your Templates">
          {loading ? (
            <Card className="p-8 sm:p-16 text-center">
              <div className="w-6 h-6 sm:w-8 sm:w-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading templates...</p>
            </Card>
          ) : filteredTemplates.length === 0 ? (
            <Card className="p-8 sm:p-16 text-center bg-gradient-to-br from-white to-purple-50 border-purple-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                {searchTerm 
                  ? `No templates match "${searchTerm}". Try a different search term.`
                  : 'Create your first email template to start building personalized campaigns. Templates support variables like {{ first_name }} for dynamic content.'
                }
              </p>
              {!searchTerm && (
                <PrimaryButton 
                  onClick={handleCreateClick}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 ${
                    canCreateTemplate 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  } text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base`}
                  disabled={!canCreateTemplate}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden sm:inline">Create Your First Template</span>
                  <span className="sm:hidden">Create Template</span>
                </PrimaryButton>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="group cursor-pointer"
                  onClick={() => openTemplateModal(t.id)}
                >
                  <Card className="p-3 sm:p-4 lg:p-6 h-full hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-transparent group-hover:border-purple-200">
                    {/* Template Header */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 lg:mb-4">
                      <div className="flex-1 min-w-0">
                        <label 
                          className="inline-flex items-center gap-2 text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input 
                            type="checkbox" 
                            checked={selected.includes(t.id)} 
                            onChange={(e) => setSelected(e.target.checked ? [...selected, t.id] : selected.filter(x => x !== t.id))} 
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="truncate">{t.name || 'Untitled Template'}</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full whitespace-nowrap">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="hidden sm:inline">{Array.isArray(t.variables) ? t.variables.length : 0} vars</span>
                          <span className="sm:hidden">{Array.isArray(t.variables) ? t.variables.length : 0}</span>
                        </span>
                      </div>
                    </div>

                    {/* Template Stats */}
                    <div className="mb-2 sm:mb-3 lg:mb-4">
                      <div className="text-xs text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide font-medium">Version</div>
                      <div className="text-lg sm:text-xl font-bold text-purple-600 bg-purple-50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-200">
                        v{t.version || 1}
                      </div>
                    </div>

                    {/* Subject Preview */}
                    <div className="mb-2 sm:mb-3 lg:mb-4">
                      <div className="text-xs text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide font-medium">Subject</div>
                      <div className="text-xs sm:text-sm text-gray-700 bg-gray-50 rounded px-2 sm:px-3 py-1 sm:py-1.5 lg:py-2 border truncate">
                        {render(t.subject || '') || 'No subject'}
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="mb-2 sm:mb-3 lg:mb-4">
                      <div className="text-xs text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide font-medium">Template Details</div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <div className="text-xs sm:text-sm text-gray-700 bg-gray-50 rounded px-2 sm:px-3 py-1 sm:py-1.5 border">
                          <span className="font-medium">Created:</span> {new Date(t.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        {t.updated_at && (
                          <div className="text-xs sm:text-sm text-gray-700 bg-gray-50 rounded px-2 sm:px-3 py-1 sm:py-1.5 border">
                            <span className="font-medium">Updated:</span> {new Date(t.updated_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Click to view details</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-3 lg:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Template Details</h2>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
                      {currentTemplate.version ? `Version ${currentTemplate.version}` : 'View and manage your template'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/templates/${currentTemplate.id}/edit`}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow"
                    >
                      Edit Template
                    </a>
                    <button 
                      aria-label="Close" 
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2" 
                      onClick={() => setOpenView(false)}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Template Information */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Template Information</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Template Name</div>
                          <div className="text-sm font-medium text-gray-900 bg-white rounded px-3 py-2 border">
                            {currentTemplate.name || 'Untitled Template'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Version</div>
                          <div className="text-sm font-medium text-purple-600 bg-white rounded px-3 py-2 border">
                            v{currentTemplate.version || 1}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Created</div>
                          <div className="text-sm font-medium text-gray-900 bg-white rounded px-3 py-2 border">
                            {new Date(currentTemplate.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric',
                              month: 'long', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        {currentTemplate.updated_at && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Last Updated</div>
                            <div className="text-sm font-medium text-gray-900 bg-white rounded px-3 py-2 border">
                              {new Date(currentTemplate.updated_at).toLocaleDateString('en-US', { 
                                year: 'numeric',
                                month: 'long', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Variables</h3>
                      {currentTemplate.variables && currentTemplate.variables.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentTemplate.variables.map((v: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No variables detected</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Preview */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Subject Preview</h3>
                      <div className="bg-white border rounded-lg p-3">
                        <div className="text-sm text-gray-900">
                          {render(currentTemplate.subject) || 'No subject'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">HTML Preview</h3>
                      <div className="bg-white border rounded-lg p-3 max-h-64 overflow-y-auto">
                        <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: render(currentTemplate.html) || '<p class="text-gray-400">No content</p>' }} />
                      </div>
                    </div>
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



