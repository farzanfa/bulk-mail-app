"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Section, Input, Button, Card } from '@/components/ui';
import ConfirmModal from '@/components/ConfirmModal';

export default function UploadDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const [upload, setUpload] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: 'email' | 'created'; dir: 'asc' | 'desc' }>({ key: 'created', dir: 'asc' });
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteUploadModal, setShowDeleteUploadModal] = useState(false);
  const [showDeleteContactsModal, setShowDeleteContactsModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const pageSize = 50;

  async function load() {
    try {
      setLoading(true);
      const u = await fetch(`/api/uploads/${id}`, { cache: 'no-store' }).then(r => r.json());
      setUpload(u.upload);
      const c = await fetch(`/api/uploads/${id}/contacts?search=${encodeURIComponent(search)}&page=${page}`, { cache: 'no-store' }).then(r => r.json());
      setItems(c.items || []);
      setTotal(c.total || 0);
    } catch (err: any) {
      console.error('Failed to load upload details:', err);
      toast.error('Failed to load upload details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id, page, search]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  const handleDeleteUpload = async () => {
    setDeleteMessage('Are you sure you want to delete this upload and all contacts created from it? This action cannot be undone.');
    setDeleteAction(() => async () => {
      try {
        setDeleting(true);
        const res = await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
        if (!res.ok) { 
          toast.error('Delete failed'); 
          return; 
        }
        toast.success('Upload deleted successfully');
        window.location.href = '/uploads';
      } catch (err: any) {
        console.error('Delete failed:', err);
        toast.error('Delete failed');
      } finally {
        setDeleting(false);
      }
    });
    setShowDeleteUploadModal(true);
  };

  const handleDeletePageContacts = async () => {
    if (items.length === 0) {
      toast.error('No contacts to delete on this page');
      return;
    }

    const ids = items.map((c: any) => c.id);
    setDeleteMessage(`Delete or unsubscribe ${ids.length} contacts from this page? This action cannot be undone.`);
    setDeleteAction(() => async () => {
      try {
        const res = await fetch('/api/contacts', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ids }) 
        });
        const json = await res.json();
        toast.success(`Successfully processed: ${json.deleted} deleted, ${json.unsubscribed} unsubscribed`);
        await load();
      } catch (err: any) {
        console.error('Delete failed:', err);
        toast.error('Failed to delete contacts');
      }
    });
    setShowDeleteContactsModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) {
      toast.error('Select contacts to delete');
      return;
    }

    setDeleteMessage(`Delete or unsubscribe ${selected.length} selected contacts? This action cannot be undone.`);
    setDeleteAction(() => async () => {
      try {
        const res = await fetch('/api/contacts', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ids: selected }) 
        });
        const json = await res.json();
        toast.success(`Successfully processed: ${json.deleted} deleted, ${json.unsubscribed} unsubscribed`);
        setSelected([]);
        await load();
      } catch (err: any) {
        console.error('Delete failed:', err);
        toast.error('Failed to delete contacts');
      }
    });
    setShowDeleteSelectedModal(true);
  };

  const selectAll = () => {
    if (selected.length === items.length) {
      setSelected([]);
    } else {
      setSelected(items.map((c: any) => c.id));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => router.back()}
                className="p-2.5 hover:bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-white shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Upload Details</h1>
            </div>
            {upload && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-lg sm:text-xl text-gray-600 mb-2">{upload.filename}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {upload.row_count?.toLocaleString() || '0'} contacts
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(upload.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href={`/api/uploads/${id}/export`} 
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </a>
                  <button 
                    onClick={handleDeleteUpload}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Stats Cards */}
        {upload && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm text-gray-500 font-medium mb-1">File Name</h3>
              <p className="text-lg font-semibold text-gray-900 truncate">{upload.filename}</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm text-gray-500 font-medium mb-1">Total Contacts</h3>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{upload.row_count?.toLocaleString() || '0'}</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm text-gray-500 font-medium mb-1">Columns</h3>
              <p className="text-2xl font-bold text-gray-900">{upload.columns?.length || 0}</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm text-gray-500 font-medium mb-1">Upload Date</h3>
              <p className="text-lg font-semibold text-gray-900">{new Date(upload.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}</p>
            </div>
          </div>
        )}

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
                placeholder="Search contacts by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-11 pr-4 py-3 w-full border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="group px-5 py-2.5 text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 bg-white rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <div className={`w-4 h-4 rounded border-2 ${selected.length === items.length ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-gray-400'} transition-colors`}>
                  {selected.length === items.length && (
                    <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span>{selected.length === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}</span>
              </button>
              
              <button
                onClick={handleDeletePageContacts}
                disabled={items.length === 0}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                  items.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Page</span>
              </button>
              
              <button
                onClick={handleDeleteSelected}
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

        {/* Contacts Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-lg text-gray-600 font-medium">Loading contacts...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-600">
                {search ? `No contacts match "${search}"` : 'No contacts in this upload'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <div className={`w-5 h-5 rounded border-2 ${selected.length === items.length ? 'bg-purple-600 border-purple-600' : 'border-gray-300'} transition-colors cursor-pointer`} onClick={selectAll}>
                          {selected.length === items.length && (
                            <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((contact: any) => (
                      <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selected.includes(contact.id)} 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelected([...selected, contact.id]);
                              } else {
                                setSelected(selected.filter(id => id !== contact.id));
                              }
                            }} 
                            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{contact.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            contact.unsubscribed 
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {contact.unsubscribed ? 'Unsubscribed' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(contact.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                            CSV Upload
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(page * pageSize, total)}</span> of{' '}
                      <span className="font-semibold">{total}</span> contacts
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          page === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <button
                              key={i}
                              onClick={() => setPage(pageNum)}
                              className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                                page === pageNum
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          page === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Modals */}
      <ConfirmModal
        isOpen={showDeleteUploadModal}
        onClose={() => setShowDeleteUploadModal(false)}
        onConfirm={() => {
          if (deleteAction) {
            deleteAction();
          }
        }}
        title="Delete Upload"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showDeleteContactsModal}
        onClose={() => setShowDeleteContactsModal(false)}
        onConfirm={() => {
          if (deleteAction) {
            deleteAction();
          }
        }}
        title="Delete Contacts"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showDeleteSelectedModal}
        onClose={() => setShowDeleteSelectedModal(false)}
        onConfirm={() => {
          if (deleteAction) {
            deleteAction();
          }
        }}
        title="Delete Selected Contacts"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}


