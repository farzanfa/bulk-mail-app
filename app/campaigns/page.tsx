"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Section, Button, Card, PrimaryButton, Input, Select } from '@/components/ui';
import { StatusBadge } from '@/components/status';
import { ConfirmButton } from '@/components/confirm';
import { CampaignNewModal } from '@/components/CampaignNewModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function CampaignsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'status'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  async function refresh() {
    const res = await fetch('/api/campaigns', { cache: 'no-store' });
    const json = await res.json();
    setItems(json.campaigns || []);
  }

  async function fetchUserPlan() {
    try {
      const res = await fetch('/api/me', { cache: 'no-store', credentials: 'include' });
      const json = await res.json();
      if (json.user?.plan) {
        setUserPlan(json.user.plan);
      }
    } catch (e) {
      console.error('Failed to fetch user plan:', e);
    }
  }

  useEffect(() => {
    (async () => {
      await Promise.all([refresh(), fetchUserPlan()]);
      setLoading(false);
    })();
  }, []);

  async function openCampaignModal(id: string) {
    try {
      const r = await fetch(`/api/campaigns/${id}`, { cache: 'no-store' });
      const j = await r.json();
      setCurrent(j.campaign);
      setOpenEdit(true);
    } catch (e: any) {
      toast.error('Failed to load campaign');
    }
  }

  const [busyRun, setBusyRun] = useState(false);
  const [busyLaunch, setBusyLaunch] = useState(false);
  const [busyPause, setBusyPause] = useState(false);
  async function launch() {
    if (!current) return;
    setBusyLaunch(true);
    const res = await fetch(`/api/campaigns/${current.id}/launch`, { method: 'POST' });
    if (!res.ok) { toast.error('Launch failed'); return; }
    toast.success('Campaign launched');
    await refresh();
    await openCampaignModal(current.id);
    setBusyLaunch(false);
  }
  async function pause() {
    if (!current) return;
    setBusyPause(true);
    const res = await fetch(`/api/campaigns/${current.id}/pause`, { method: 'POST' });
    if (!res.ok) { toast.error('Pause failed'); return; }
    toast.success('Campaign paused');
    await refresh();
    await openCampaignModal(current.id);
    setBusyPause(false);
  }
  async function runNow() {
    if (!current) return;
    setBusyRun(true);
    const res = await fetch(`/api/campaigns/${current.id}/run`, { method: 'POST' });
    if (!res.ok) { toast.error('Run failed'); return; }
    toast.success('Worker triggered');
    await refresh();
    await openCampaignModal(current.id);
    setBusyRun(false);
  }

  // Filter and sort campaigns
  const filteredCampaigns = items.filter(campaign => {
    const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'created_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (sortDir === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Select all filtered campaigns
  const selectAll = () => {
    if (selected.length === filteredCampaigns.length && filteredCampaigns.length > 0) {
      setSelected([]);
    } else {
      setSelected(filteredCampaigns.map(c => c.id));
    }
  };

  async function bulkDelete() {
    if (selected.length === 0) return;
    
    setDeleteMessage(`Are you sure you want to delete ${selected.length} campaign(s)? This action cannot be undone.`);
    setDeleteAction(() => async () => {
      try {
        for (const id of selected) {
          await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
        }
        setSelected([]);
        await refresh();
        toast.success(`Successfully deleted ${selected.length} campaign(s)`);
      } catch (err) {
        toast.error('Delete failed');
      }
    });
    setShowDeleteModal(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section with consistent styling */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeInUp">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Email Campaigns
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage your email marketing campaigns
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <PrimaryButton 
                onClick={() => setOpenNew(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Campaign
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fadeInUp" style={{ animationDelay: '50ms' }}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="running">Running</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </Select>
              
              <Select 
                value={`${sortBy}-${sortDir}`} 
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortDir(dir as any);
                }}
                className="min-w-[150px]"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Button
                onClick={selectAll}
                className="px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-purple-300 hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{selected.length === filteredCampaigns.length && filteredCampaigns.length > 0 ? 'Deselect All' : 'Select All'}</span>
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
            
            <div className="text-sm text-gray-600">
              {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Campaigns Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading campaigns...</p>
            </div>
          )}
          
          {!loading && sortedCampaigns.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first campaign'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button 
                  onClick={() => setOpenNew(true)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Create Campaign
                </button>
              )}
            </div>
          )}
          
          {!loading && sortedCampaigns.length > 0 && (
            <div className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Campaigns ({sortedCampaigns.length})
                  </h3>
                  <div className="text-sm text-gray-500">
                    Showing {sortedCampaigns.length} of {items.length} total
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {sortedCampaigns.map((c) => (
                  <div key={c.id} className="group">
                    <div 
                      className="relative bg-white border border-gray-200 rounded-xl p-6 h-full cursor-pointer hover:shadow-2xl hover:border-purple-400 transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                      onClick={() => openCampaignModal(c.id)}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Header with checkbox and status */}
                      <div className="relative flex items-start justify-between gap-2 mb-4">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500 hover:scale-110 transition-transform"
                          onClick={(e) => e.stopPropagation()}
                          checked={selected.includes(c.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelected(e.target.checked ? [...selected, c.id] : selected.filter(x => x !== c.id));
                          }}
                        />
                        <StatusBadge value={c.status} />
                      </div>
                      
                      {/* Campaign name */}
                      <h4 className="relative font-bold text-lg text-gray-900 mb-3 truncate group-hover:text-purple-600 transition-colors">
                        {c.name || 'Unnamed Campaign'}
                      </h4>
                      
                      {/* Campaign details */}
                      <div className="relative space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        
                        {c.started_at && (
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <span>Started {new Date(c.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                        
                        {Array.isArray(c.recipients) && (
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <span className="font-semibold">{c.recipients.length.toLocaleString()} recipients</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress bar for running campaigns */}
                      {c.status === 'running' && c.recipients && (
                        <div className="relative mt-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span className="font-semibold">{Math.round((c.sent_count || 0) / c.recipients.length * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.round((c.sent_count || 0) / c.recipients.length * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Hover indicator */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <div className="bg-purple-600 text-white p-2 rounded-lg shadow-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Campaign Details Modal */}
        {openEdit && current && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Campaign Details</h3>
                    <p className="text-purple-100 mt-1">Manage and monitor your campaign performance</p>
                  </div>
                  <button 
                    onClick={() => setOpenEdit(false)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Campaign Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Name</span>
                          <span className="font-medium text-gray-900">{current.name || 'Unnamed Campaign'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          <StatusBadge value={current.status} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Created</span>
                          <span className="font-medium text-gray-900">
                            {new Date(current.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {current.started_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Started</span>
                            <span className="font-medium text-gray-900">
                              {new Date(current.started_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Campaign Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Template ID</span>
                          <span className="font-medium text-gray-900 font-mono text-xs">{current.template_id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Upload ID</span>
                          <span className="font-medium text-gray-900 font-mono text-xs">{current.upload_id}</span>
                        </div>
                        {Array.isArray(current.recipients) && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Recipients</span>
                            <span className="font-medium text-gray-900">{current.recipients.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                {Array.isArray(current.recipients) && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {current.recipients.filter((r: any) => r.status === 'sent').length}
                        </div>
                        <div className="text-xs text-gray-600">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {current.recipients.filter((r: any) => r.status === 'pending').length}
                        </div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {current.recipients.filter((r: any) => r.status === 'failed').length}
                        </div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {current.recipients.length}
                        </div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <a 
                      href={`/campaigns/${current.id}`} 
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium underline"
                    >
                      Open Full Page
                    </a>
                    <a 
                      href={`/api/campaigns/${current.id}/export`} 
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Export CSV
                    </a>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {(current.status === 'draft' || current.status === 'paused') && (
                      <button
                        onClick={launch}
                        disabled={busyLaunch}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {busyLaunch ? 'Launching...' : 'Launch Campaign'}
                      </button>
                    )}
                    
                    {current.status !== 'paused' && current.status !== 'draft' && (
                      <button
                        onClick={pause}
                        disabled={busyPause}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {busyPause ? 'Pausing...' : 'Pause Campaign'}
                      </button>
                    )}
                    
                    <button
                      onClick={runNow}
                      disabled={busyRun}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {busyRun ? 'Running...' : 'Run Now'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setDeleteMessage('Are you sure you want to delete this campaign and all its recipients? This action cannot be undone.');
                        setDeleteAction(() => async () => {
                          if (!current) return;
                          const res = await fetch(`/api/campaigns/${current.id}`, { method: 'DELETE' });
                          if (!res.ok) return;
                          setOpenEdit(false);
                          await refresh();
                        });
                        setShowDeleteModal(true);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {openNew && (
          <CampaignNewModal onClose={() => setOpenNew(false)} userPlan={userPlan} />
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            if (deleteAction) {
              deleteAction();
            }
          }}
          title="Confirm Deletion"
          message={deleteMessage}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </div>
  );
}



