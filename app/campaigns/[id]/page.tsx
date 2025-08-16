"use client";
import { useEffect, useState } from 'react';
import { Section, Button, Input, Select } from '@/components/ui';
import { ConfirmButton } from '@/components/confirm';
import { StatusBadge } from '@/components/status';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';

export default function CampaignDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [c, setC] = useState<any | null>(null);
  const [rec, setRec] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'status' | 'email'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const pageSize = 50;

  async function load() {
    try {
      setLoading(true);
      const [cRes, rRes] = await Promise.all([
        fetch(`/api/campaigns/${id}`, { cache: 'no-store' }),
        fetch(`/api/campaigns/${id}/recipients?page=${page}&search=${encodeURIComponent(searchTerm)}&status=${statusFilter}&sortBy=${sortBy}&sortDir=${sortDir}`, { cache: 'no-store' })
      ]);
      
      if (!cRes.ok || !rRes.ok) {
        throw new Error('Failed to load campaign data');
      }
      
      const cJson = await cRes.json();
      const rJson = await rRes.json();
      
      setC(cJson.campaign);
      setRec(rJson.items || []);
      setTotal(rJson.total || 0);
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
  }, [id, page, searchTerm, statusFilter, sortBy, sortDir]);

  const [busyPause, setBusyPause] = useState(false);
  const [busyRun, setBusyRun] = useState(false);
  const [busyLaunch, setBusyLaunch] = useState(false);

  async function pause() {
    setBusyPause(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/pause`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to pause campaign');
      }
      toast.success('Campaign paused successfully');
      await load();
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      toast.error('Failed to pause campaign');
    } finally {
      setBusyPause(false);
    }
  }

  async function runNow() {
    setBusyRun(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/run`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to run campaign');
      }
      toast.success('Campaign worker triggered successfully');
      await load();
    } catch (error) {
      console.error('Failed to run campaign:', error);
      toast.error('Failed to run campaign');
    } finally {
      setBusyRun(false);
    }
  }

  async function launch() {
    setBusyLaunch(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/launch`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to launch campaign');
      }
      toast.success('Campaign launched successfully');
      await load();
    } catch (error) {
      console.error('Failed to launch campaign:', error);
      toast.error('Failed to launch campaign');
    } finally {
      setBusyLaunch(false);
    }
  }

  async function deleteCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete campaign');
      }
      toast.success('Campaign deleted successfully');
      // Redirect to campaigns list
      window.location.href = '/campaigns';
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast.error('Failed to delete campaign');
    }
  }

  // Calculate campaign statistics
  const completed = c ? c.recipients.filter((r: any) => r.status !== 'pending').length : 0;
  const progress = c ? Math.round((completed / Math.max(1, c.recipients.length)) * 100) : 0;
  const sentCount = c ? c.recipients.filter((r: any) => r.status === 'sent').length : 0;
  const failedCount = c ? c.recipients.filter((r: any) => r.status === 'failed').length : 0;
  const pendingCount = c ? c.recipients.filter((r: any) => r.status === 'pending').length : 0;

  // Helper functions
  const handleSort = (field: 'created_at' | 'status' | 'email') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('created_at');
    setSortDir('desc');
    setPage(1);
  };

  if (loading && !c) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaign details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Not Found</h3>
            <p className="text-gray-600 mb-4">The campaign you're looking for doesn't exist or has been deleted.</p>
            <a href="/campaigns" className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Campaigns
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
                href="/campaigns"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Campaigns
              </a>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {c.name || `Campaign ${id}`}
                </h1>
                <p className="text-gray-600">Manage and monitor your email campaign</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {(c.status === 'draft' || c.status === 'paused') && (
                <button
                  onClick={launch}
                  disabled={busyLaunch}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                  {busyLaunch ? 'Launching...' : 'Launch Campaign'}
                </button>
              )}
              
              {c.status !== 'paused' && c.status !== 'draft' && (
                <button
                  onClick={pause}
                  disabled={busyPause}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                  {busyPause ? 'Pausing...' : 'Pause Campaign'}
                </button>
              )}
              
              <button
                onClick={runNow}
                disabled={busyRun}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                {busyRun ? 'Running...' : 'Run Now'}
              </button>
              
              <button
                onClick={() => {
                  setDeleteMessage('Are you sure you want to delete this campaign and all its recipients? This action cannot be undone.');
                  setDeleteAction(() => deleteCampaign);
                  setShowDeleteModal(true);
                }}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{c.recipients?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Recipients</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{sentCount}</div>
            <div className="text-sm text-gray-600">Emails Sent</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{failedCount}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Campaign Progress</h2>
            <div className="text-sm text-gray-600">
              {completed} of {c.recipients?.length || 0} completed
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="search"
                  placeholder="Search recipients..."
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
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </Select>
              
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <a 
                href={`/api/campaigns/${id}/export`}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
              >
                Export CSV
              </a>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Sort by:</span>
            {[
              { field: 'created_at', label: 'Date Created' },
              { field: 'status', label: 'Status' },
              { field: 'email', label: 'Email' }
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

        {/* Recipients Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recipients</h2>
              <div className="text-sm text-gray-500">
                Showing {rec.length} of {total} total
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading recipients...</p>
            </div>
          ) : rec.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipients found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'This campaign has no recipients yet'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {rec.map((r) => (
                  <div key={r.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {r.rendered_subject || '(No subject)'}
                        </div>
                        {r.contact?.email && (
                          <div className="text-sm text-gray-500 mt-1">
                            {r.contact.email}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <StatusBadge value={r.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {Math.ceil(total / pageSize) > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <button 
                      disabled={page <= 1} 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <span>Page {page} of {Math.ceil(total / pageSize)}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(Math.ceil(total / pageSize), page - 2 + i));
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`px-2 py-1 rounded text-xs ${
                                pageNum === page 
                                  ? 'bg-purple-600 text-white' 
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              } transition-colors`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <button 
                      disabled={page >= Math.ceil(total / pageSize)} 
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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



