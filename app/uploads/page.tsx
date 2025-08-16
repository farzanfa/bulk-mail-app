"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Section, Input, PrimaryButton, Button, Card } from '@/components/ui';
import ConfirmModal from '@/components/ConfirmModal';

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

  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch('/api/uploads', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch uploads: ${res.status}`);
      }
      const json = await res.json();
      setUploads(json.uploads || []);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight">
              CSV Uploads
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2 leading-relaxed">
              Upload and manage your contact lists for email campaigns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <label className="inline-flex items-center justify-center gap-2 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg cursor-pointer font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={onFileChange} 
                disabled={busy} 
              />
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white/60 border-t-white rounded-full" /> 
                  Processing...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="hidden sm:inline">Upload CSV</span>
                  <span className="sm:hidden">Upload</span>
                </>
              )}
            </label>
          </div>
        </div>

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
              placeholder="Search uploads..."
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
                <span>{selected.length === filteredUploads.length ? 'Deselect All' : 'Select All'}</span>
              </div>
            </Button>
            
            <button
              onClick={async () => {
                if (selected.length === 0) return;
                await bulkDelete();
              }}
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
                    ? 'No Uploads Selected' 
                    : `Delete Selected (${selected.length})`
                  }
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Uploads Grid */}
        <Section title="Your Uploads">
          {loading ? (
            <Card className="p-8 sm:p-16 text-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading uploads...</p>
            </Card>
          ) : filteredUploads.length === 0 ? (
            <Card className="p-8 sm:p-16 text-center bg-gradient-to-br from-white to-purple-50 border-purple-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No uploads found' : 'No uploads yet'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                {searchTerm 
                  ? `No uploads match "${searchTerm}". Try a different search term.`
                  : 'Upload your first CSV file to start building your contact lists. Supported formats: .csv files with headers.'
                }
              </p>
              {!searchTerm && (
                <label className="inline-flex items-center justify-center gap-2 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg cursor-pointer font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                  <input type="file" accept=".csv" className="hidden" onChange={onFileChange} />
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="hidden sm:inline">Upload Your First CSV</span>
                  <span className="sm:hidden">Upload CSV</span>
                </label>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredUploads.map(upload => (
                <div
                  key={upload.id}
                  className="group cursor-pointer"
                  onClick={() => openUploadModal(upload.id)}
                >
                  <Card className="p-3 sm:p-4 lg:p-6 h-full hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-transparent group-hover:border-purple-200">
                    {/* Upload Header */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 lg:mb-4">
                      <div className="flex-1 min-w-0">
                        <label 
                          className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input 
                            type="checkbox" 
                            checked={selected.includes(upload.id)} 
                            onChange={(e) => setSelected(e.target.checked ? [...selected, upload.id] : selected.filter(x => x !== upload.id))} 
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="truncate">{upload.filename}</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="hidden sm:inline">Upload</span>
                          <span className="sm:hidden">U</span>
                        </span>
                      </div>
                    </div>

                    {/* Upload Stats */}
                    <div className="mb-2 sm:mb-3 lg:mb-4">
                      <div className="text-xs text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide font-medium">Contact Count</div>
                      <div className="text-lg sm:text-xl font-bold text-purple-600 bg-purple-50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-200">
                        {upload.row_count?.toLocaleString() || '0'} contacts
                      </div>
                    </div>

                    {/* Upload Info */}
                    <div className="mb-2 sm:mb-3 lg:mb-4">
                      <div className="text-xs text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wide font-medium">Upload Details</div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <div className="text-xs sm:text-sm text-gray-700 bg-gray-50 rounded px-2 sm:px-3 py-1 sm:py-1.5 border">
                          <span className="font-medium">Uploaded:</span> {new Date(upload.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        {upload.columns && upload.columns.length > 0 && (
                          <div className="text-xs sm:text-sm text-gray-700 bg-gray-50 rounded px-2 sm:px-3 py-1 sm:py-1.5 border">
                            <span className="font-medium">Columns:</span> {upload.columns.length} fields
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

        {/* Upload Details Modal */}
        {openEdit && current && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-3 lg:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Upload Details</h2>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">View and manage your CSV upload</p>
                  </div>
                  <button 
                    aria-label="Close" 
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2" 
                    onClick={() => setOpenEdit(false)}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* File Information */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">File Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Filename</div>
                        <div className="text-sm sm:text-base font-medium text-gray-900 break-all bg-white rounded px-2 sm:px-3 py-1.5 sm:py-2 border">
                          {current.filename}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Contact Count</div>
                        <div className="text-sm sm:text-base font-medium text-purple-600 bg-white rounded px-2 sm:px-3 py-1.5 sm:py-2 border">
                          {current.row_count?.toLocaleString() || '0'} contacts
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Upload Date</div>
                        <div className="text-sm sm:text-base font-medium text-gray-900 bg-white rounded px-2 sm:px-3 py-1.5 sm:py-2 border">
                          {new Date(current.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      {current.columns && current.columns.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Columns</div>
                          <div className="text-sm sm:text-base font-medium text-gray-900 bg-white rounded px-2 sm:px-3 py-1.5 sm:py-2 border">
                            {current.columns.length} fields
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column Details */}
                  {current.columns && current.columns.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">CSV Columns</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {current.columns.map((column: string, index: number) => (
                          <div key={index} className="bg-white rounded px-2 sm:px-3 py-1.5 sm:py-2 border text-xs sm:text-sm font-medium text-gray-700">
                            {column}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <a 
                    href={`/uploads/${current.id}`} 
                    className="text-sm sm:text-base text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    View Full Details Page
                  </a>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <a 
                      href={`/api/uploads/${current.id}/export`} 
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-white font-medium transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export CSV</span>
                      </div>
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
                      className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-red-700"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Upload</span>
                      </div>
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



