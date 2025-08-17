"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Section, Input, PrimaryButton, Button, Card } from '@/components/ui';
import ConfirmModal from '@/components/ConfirmModal';

interface UploadLimits {
  used: number;
  total: number;
  remaining: number;
}

interface UserPlan {
  planName: string;
  planType: string;
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [limits, setLimits] = useState<UploadLimits | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      const [uploadsRes, meRes] = await Promise.all([
        fetch('/api/uploads', { cache: 'no-store' }),
        fetch('/api/me', { cache: 'no-store' })
      ]);
      
      if (!uploadsRes.ok) {
        throw new Error(`Failed to fetch uploads: ${uploadsRes.status}`);
      }
      
      const uploadsJson = await uploadsRes.json();
      setUploads(uploadsJson.uploads || []);
      setLimits(uploadsJson.limits || null);
      
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.subscription && meData.subscription.plan) {
          setUserPlan({
            planName: meData.subscription.plan.name,
            planType: meData.subscription.plan.type
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to refresh uploads:', err);
      toast.error('Failed to load uploads');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if upload limit is reached
    if (limits && limits.remaining === 0) {
      toast.error('Upload limit reached. Please upgrade your plan.');
      e.target.value = '';
      return;
    }
    
    setBusy(true);
    try {
      // 1) upload to blob
      const fd = new FormData();
      fd.append('file', file);
      fd.append('filename', file.name);
      
      const up = await fetch('/api/blob-upload', { method: 'POST', body: fd });
      const u = await up.json();
      if (!up.ok) throw new Error(u.error || 'Blob upload failed');
      
      // 2) create upload row
      const create = await fetch('/api/uploads', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          blob_key: u.url, 
          filename: file.name, 
          columns: [], 
          row_count: 0 
        }) 
      });
      
      const created = await create.json();
      if (!create.ok) throw new Error(created.error || 'Upload create failed');
      
      // 3) parse to contacts
      const parse = await fetch('/api/uploads/parse', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          blob_key: u.url, 
          upload_id: created.upload.id 
        }) 
      });
      
      const parsed = await parse.json();
      if (!parse.ok) throw new Error(parsed.error || 'Parse failed');
      
      await refresh();
      toast.success(`Successfully parsed ${parsed.total} contacts from ${file.name}`);
    } catch (e: any) {
      console.error('Upload failed:', e);
      toast.error(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function bulkDelete() {
    if (selected.length === 0) return;
    
    setDeleteMessage(`Are you sure you want to delete ${selected.length} upload(s) and their contacts? This action cannot be undone.`);
    setDeleteAction(() => async () => {
      try {
        const res = await fetch('/api/uploads', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ids: selected }) 
        });
        
        const json = await res.json();
        if (!res.ok) { 
          toast.error(json.error || 'Delete failed'); 
          return; 
        }
        
        toast.success(`Successfully deleted ${json.deleted} upload(s)`);
        setSelected([]);
        await refresh();
      } catch (err: any) {
        console.error('Bulk delete failed:', err);
        toast.error('Delete failed');
      }
    });
    setShowDeleteModal(true);
  }

  async function openUploadModal(id: string) {
    try {
      const r = await fetch(`/api/uploads/${id}`, { cache: 'no-store' });
      if (!r.ok) {
        throw new Error(`Failed to load upload: ${r.status}`);
      }
      const j = await r.json();
      setCurrent(j.upload);
      setOpenEdit(true);
    } catch (e: any) {
      console.error('Failed to load upload:', e);
      toast.error('Failed to load upload details');
    }
  }

  // Filter uploads based on search term
  const filteredUploads = uploads.filter(upload => 
    upload.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.row_count?.toString().includes(searchTerm) ||
    new Date(upload.created_at).toLocaleDateString().includes(searchTerm)
  );

  // Select all filtered uploads
  const selectAll = () => {
    if (selected.length === filteredUploads.length) {
      setSelected([]);
    } else {
      setSelected(filteredUploads.map(u => u.id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {userPlan ? `${userPlan.planName} Uploads` : 'CSV Uploads'}
                </h1>
                {userPlan && (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                    userPlan.planType === 'enterprise' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/25 shadow-lg' :
                    userPlan.planType === 'professional' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25 shadow-lg' :
                    userPlan.planType === 'starter' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25 shadow-lg' :
                    'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-gray-500/25 shadow-lg'
                  }`}>
                    {userPlan.planType.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl">
                Upload and manage your contact lists for powerful email campaigns
              </p>
              {limits && limits.total !== -1 && (
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-600">Usage:</div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${
                        limits.remaining === 0 ? 'text-red-600' :
                        limits.remaining <= 2 ? 'text-orange-600' :
                        'text-gray-900'
                      }`}>
                        {limits.used}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="font-medium text-gray-700">{limits.total}</span>
                    </div>
                  </div>
                  {limits.remaining <= 2 && limits.remaining > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold bg-orange-50 px-3 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Only {limits.remaining} upload{limits.remaining === 1 ? '' : 's'} left
                    </span>
                  )}
                  {limits.remaining === 0 && (
                    <a 
                      href="/pricing" 
                      className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold underline decoration-2 underline-offset-2"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      Upgrade for unlimited
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className={`group relative inline-flex items-center justify-center gap-2 text-sm sm:text-base ${
                limits && limits.remaining === 0 
                  ? 'bg-gray-200 cursor-not-allowed text-gray-500' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 cursor-pointer text-white transform hover:scale-105'
              } px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold shadow-xl transition-all duration-300`}>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={onFileChange} 
                  disabled={busy || (limits?.remaining === 0)} 
                />
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> 
                    Processing...
                  </span>
                ) : limits && limits.remaining === 0 ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Limit Reached</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload CSV</span>
                  </>
                )}
                {!busy && limits && limits.remaining !== 0 && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
                )}
              </label>
              {limits && limits.remaining === 0 && (
                <a 
                  href="/pricing" 
                  className="px-6 py-3 bg-white hover:bg-gray-50 text-purple-600 font-semibold rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Upgrade Plan
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search by filename, contacts, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 w-full border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="group px-5 py-2.5 text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 bg-white rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <div className={`w-4 h-4 rounded border-2 ${selected.length === filteredUploads.length ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-gray-400'} transition-colors`}>
                  {selected.length === filteredUploads.length && (
                    <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span>{selected.length === filteredUploads.length ? 'Deselect All' : 'Select All'}</span>
              </button>
              
              <button
                onClick={bulkDelete}
                disabled={selected.length === 0}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                  selected.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete {selected.length > 0 && `(${selected.length})`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Usage Card - Show when user has upload limits */}
        {limits && limits.total !== -1 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Upload Usage
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="flex-1 max-w-md">
                      <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-white/80">Used Uploads</span>
                        <span className="text-white">{limits.used} / {limits.total}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            limits.remaining === 0 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                            limits.remaining <= 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                            'bg-gradient-to-r from-green-400 to-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (limits.used / limits.total) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-sm text-white/80">
                        {limits.remaining} upload{limits.remaining === 1 ? '' : 's'} remaining
                      </div>
                    </div>
                    {limits.remaining < limits.total && (
                      <a 
                        href="/pricing" 
                        className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Upgrade
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploads Grid */}
        <Section title="Your Uploads" className="!p-0">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-lg text-gray-600 font-medium">Loading your uploads...</p>
            </div>
          ) : filteredUploads.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchTerm ? 'No uploads found' : 'No uploads yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? `No uploads match "${searchTerm}". Try a different search term.`
                  : limits && limits.remaining === 0
                  ? 'You\'ve reached your upload limit. Upgrade your plan to upload more CSV files.'
                  : 'Upload your first CSV file to start building your contact lists. Supported formats: .csv files with headers.'
                }
              </p>
              {!searchTerm && (
                limits && limits.remaining === 0 ? (
                  <a 
                    href="/pricing" 
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Upgrade Plan</span>
                  </a>
                ) : (
                  <label className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl cursor-pointer font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <input type="file" accept=".csv" className="hidden" onChange={onFileChange} />
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Your First CSV</span>
                  </label>
                )
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUploads.map((upload, index) => (
                <div
                  key={upload.id}
                  className="group relative"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div 
                    onClick={() => openUploadModal(upload.id)}
                    className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-purple-200 transform hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative p-6">
                      {/* Upload Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <label 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                checked={selected.includes(upload.id)} 
                                onChange={(e) => setSelected(e.target.checked ? [...selected, upload.id] : selected.filter(x => x !== upload.id))} 
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                                selected.includes(upload.id) 
                                  ? 'bg-purple-600 border-purple-600' 
                                  : 'border-gray-300 group-hover:border-gray-400'
                              }`}>
                                {selected.includes(upload.id) && (
                                  <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                              {upload.filename}
                            </h3>
                          </label>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-semibold rounded-lg shadow-sm">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Active
                        </span>
                      </div>

                      {/* Upload Stats */}
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Contacts</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                              {upload.row_count?.toLocaleString() || '0'}
                            </span>
                            <span className="text-sm text-gray-500">contacts</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{new Date(upload.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </div>
                          {upload.columns && upload.columns.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                              </svg>
                              <span>{upload.columns.length} fields</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hover Action */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500 group-hover:text-purple-600 transition-colors">View details</span>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Upload Details Modal */}
        {openEdit && current && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpenEdit(false)}
            />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Upload Details</h2>
                    <p className="text-gray-600">View and manage your CSV upload</p>
                  </div>
                  <button 
                    aria-label="Close" 
                    className="p-2 hover:bg-white/80 rounded-xl transition-colors" 
                    onClick={() => setOpenEdit(false)}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {/* File Information Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      File Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Filename</div>
                        <div className="font-medium text-gray-900 bg-white rounded-lg px-4 py-2.5 border border-gray-200">
                          {current.filename}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Contact Count</div>
                        <div className="font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent bg-white rounded-lg px-4 py-2.5 border border-gray-200">
                          {current.row_count?.toLocaleString() || '0'} contacts
                        </div>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Upload Date</div>
                        <div className="font-medium text-gray-900 bg-white rounded-lg px-4 py-2.5 border border-gray-200">
                          {new Date(current.created_at).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column Details */}
                  {current.columns && current.columns.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-purple-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        CSV Columns ({current.columns.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {current.columns.map((column: string, index: number) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-purple-200"
                          >
                            {column}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <a 
                    href={`/uploads/${current.id}`} 
                    className="text-purple-600 hover:text-purple-700 font-semibold underline decoration-2 underline-offset-2 transition-colors"
                  >
                    View Full Details Page →
                  </a>
                  <div className="flex items-center gap-3">
                    <a 
                      href={`/api/uploads/${current.id}/export`} 
                      className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-white font-semibold transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export CSV</span>
                    </a>
                    <button
                      onClick={async () => {
                        setDeleteMessage('Are you sure you want to delete this upload and all contacts created from it? This action cannot be undone.');
                        setDeleteAction(() => async () => {
                          try {
                            const res = await fetch(`/api/uploads/${current.id}`, { method: 'DELETE' });
                            if (!res.ok) { 
                              toast.error('Delete failed'); 
                              return; 
                            }
                            toast.success('Upload deleted successfully');
                            setOpenEdit(false);
                            await refresh();
                          } catch (err: any) {
                            console.error('Delete failed:', err);
                            toast.error('Delete failed');
                          }
                        });
                        setShowDeleteModal(true);
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Upload</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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



