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
      const res = await fetch('/api/me', { cache: 'no-store' });
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
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name || a.id;
        bValue = b.name || b.id;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
    }

    if (sortDir === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    
    setDeleteMessage(`Are you sure you want to delete ${selected.length} campaign(s) and all their recipients? This action cannot be undone.`);
    setDeleteAction(() => async () => {
      try {
        const res = await fetch('/api/campaigns', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ids: selected }) 
        });
        if (!res.ok) {
          throw new Error('Failed to delete campaigns');
        }
        toast.success(`Successfully deleted ${selected.length} campaign(s)`);
        setSelected([]);
        await refresh();
      } catch (err: any) {
        console.error('Failed to delete campaigns:', err);
        toast.error('Failed to delete campaigns');
      }
    });
    setShowDeleteModal(true);
  };

  const handleSort = (field: 'created_at' | 'name' | 'status') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const selectAll = () => {
    if (selected.length === filteredCampaigns.length) {
      setSelected([]);
    } else {
      setSelected(filteredCampaigns.map(c => c.id));
    }
  };
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaigns</h1>
        <p className="text-gray-600">Manage and monitor your email campaigns</p>
      </div>

      {/* Search, Filters, and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="search"
                placeholder="Search campaigns by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </Select>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
            <button
              onClick={selectAll}
              className="px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
            >
              {selected.length === filteredCampaigns.length ? 'Deselect All' : 'Select All'}
            </button>
            
            <button
              onClick={handleBulkDelete}
              disabled={selected.length === 0}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            >
              Delete Selected ({selected.length})
            </button>
            
            <button 
              onClick={() => setOpenNew(true)} 
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Campaign
            </button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Sort by:</span>
          {[
            { field: 'created_at', label: 'Date Created' },
            { field: 'name', label: 'Name' },
            { field: 'status', label: 'Status' }
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSort(field as any)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                sortBy === field
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {label}
              <svg className={`w-4 h-4 transition-transform ${sortBy === field && sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          ))}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {sortedCampaigns.map((c) => (
                <div key={c.id} className="group">
                  <div 
                    className="block cursor-pointer bg-white border border-gray-200 rounded-lg p-4 h-full hover:shadow-lg hover:border-purple-300 transition-all duration-200"
                    onClick={() => openCampaignModal(c.id)}
                  >
                    {/* Header with checkbox and status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
                    <h4 className="font-semibold text-gray-900 mb-2 truncate group-hover:text-purple-600 transition-colors">
                      {c.name || 'Unnamed Campaign'}
                    </h4>
                    
                    {/* Campaign details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Created: {new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {c.started_at && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Started: {new Date(c.started_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {Array.isArray(c.recipients) && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{c.recipients.length} recipients</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view details →
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Campaign Details</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage and monitor your campaign</p>
                </div>
                <button 
                  onClick={() => setOpenEdit(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
}



