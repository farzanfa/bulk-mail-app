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
    
    setDeleteMessage(`Are you sure you want to delete ${selected.length} upload(s)? This action cannot be undone.`);
    setDeleteAction(() => async () => {
      try {
        for (const id of selected) {
          await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
        }
        setSelected([]);
        await refresh();
        toast.success(`Successfully deleted ${selected.length} upload(s)`);
      } catch (err) {
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
    upload.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    upload.id?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section with consistent styling */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeInUp">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Contact Uploads
                </h1>
                {userPlan && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    userPlan.planType === 'admin' 
                      ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200' 
                      : userPlan.planType === 'pro'
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200'
                      : userPlan.planType === 'beta'
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {userPlan.planName}
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                Upload and manage your contact lists for email campaigns
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <label className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Contacts
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={onFileChange} 
                  className="hidden" 
                  disabled={busy || (limits && limits.remaining === 0)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Usage Limits Display */}
        {limits && limits.total !== -1 && (
          <Card className="p-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-100 animate-fadeInUp" style={{ animationDelay: '50ms' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Usage</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You've used {limits.used} of {limits.total} uploads in your plan
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (limits.used / limits.total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round((limits.used / limits.total) * 100)}%
                  </span>
                </div>
                {limits.remaining === 0 && (
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
                placeholder="Search uploads..."
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
                  <span>{selected.length === filteredUploads.length && filteredUploads.length > 0 ? 'Deselect All' : 'Select All'}</span>
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

        {/* Uploads Grid */}
        <Section title="Your Uploads">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUploads.length === 0 ? (
            <Card className="p-16 text-center bg-gradient-to-br from-gray-50 to-white">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No uploads yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm 
                  ? `No uploads match "${searchTerm}". Try a different search term.`
                  : 'Upload your first CSV file to start building your contact list for email campaigns.'
                }
              </p>
              {!searchTerm && (
                <label className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Your First CSV
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={onFileChange} 
                    className="hidden" 
                    disabled={busy || (limits && limits.remaining === 0)}
                  />
                </label>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUploads.map(upload => {
                const createdDate = new Date(upload.created_at);
                const isSelected = selected.includes(upload.id);
                
                return (
                  <Card key={upload.id} className="h-full p-6 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-purple-200">
                    {/* Upload Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelected([...selected, upload.id]);
                              } else {
                                setSelected(selected.filter(id => id !== upload.id));
                              }
                            }} 
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 transition-all"
                          />
                          <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-purple-600 transition-colors">
                            {upload.filename}
                          </h3>
                        </label>
                      </div>
                      <div className="ml-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Ready
                        </span>
                      </div>
                    </div>

                    {/* Upload Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-900">Contacts</span>
                        </div>
                        <p className="text-lg font-bold text-blue-700">
                          {upload.row_count?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          <span className="text-xs font-medium text-green-900">Columns</span>
                        </div>
                        <p className="text-lg font-bold text-green-700">
                          {upload.columns?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Upload Date */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        UPLOADED
                      </div>
                      <div className="text-sm text-gray-700">
                        {createdDate.toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <a
                        href={`/uploads/${upload.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </a>
                      
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this upload? This action cannot be undone.')) {
                            try {
                              const res = await fetch(`/api/uploads/${upload.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                toast.success('Upload deleted successfully');
                                await refresh();
                              } else {
                                toast.error('Failed to delete upload');
                              }
                            } catch (err) {
                              toast.error('Failed to delete upload');
                            }
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>

        {/* Edit Modal */}
        {openEdit && current && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Upload</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Filename</label>
                      <Input
                        type="text"
                        value={current.filename}
                        onChange={(e) => setCurrent({ ...current, filename: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 flex gap-3">
                  <PrimaryButton
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/uploads/${current.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ filename: current.filename })
                        });
                        if (res.ok) {
                          toast.success('Upload updated successfully');
                          setOpenEdit(false);
                          await refresh();
                        } else {
                          toast.error('Failed to update upload');
                        }
                      } catch (err) {
                        toast.error('Failed to update upload');
                      }
                    }}
                  >
                    Save Changes
                  </PrimaryButton>
                  <Button onClick={() => setOpenEdit(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            if (deleteAction) {
              deleteAction();
            }
          }}
          title="Delete Uploads"
          message={deleteMessage}
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
}



