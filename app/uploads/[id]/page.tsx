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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Upload Details</h1>
            </div>
            {upload && (
              <p className="text-sm sm:text-base text-gray-600">
                {upload.filename} • {new Date(upload.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} • {upload.row_count?.toLocaleString() || '0'} contacts
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <a 
              href={`/api/uploads/${id}/export`} 
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </a>
            
            <button
              onClick={handleDeleteUpload}
              disabled={deleting}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Upload</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Search and Actions */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            {/* Search Section */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  className="pl-10 w-full"
                />
              </div>
              <button 
                onClick={handleSearch}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
              >
                Search
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
              <button
                onClick={selectAll}
                className="px-4 sm:px-5 py-2.5 text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
              >
                {selected.length === items.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <button
                onClick={handleDeletePageContacts}
                disabled={items.length === 0}
                className="px-4 sm:px-5 py-2.5 text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                Delete Page ({items.length})
              </button>
              
              <button
                onClick={handleDeleteSelected}
                disabled={selected.length === 0}
                className="px-4 sm:px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                Delete Selected ({selected.length})
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div>
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total.toLocaleString()} contacts
            </div>
            {search && (
              <div className="text-blue-600">
                Search results for: "{search}"
              </div>
            )}
          </div>
          


          {/* Contacts Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Loading contacts...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {search ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {search 
                  ? `No contacts match "${search}". Try a different search term.`
                  : 'This upload contains no contacts.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left">
                      <input 
                        type="checkbox" 
                        aria-label="Select all" 
                        checked={selected.length > 0 && selected.length === items.length} 
                        onChange={selectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th 
                      className="p-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setSort(s => ({ key: 'email', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        <svg className={`w-4 h-4 transition-transform ${sort.key === 'email' && sort.dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="p-3 text-left">First Name</th>
                    <th 
                      className="p-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setSort(s => ({ key: 'created', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
                    >
                      <div className="flex items-center gap-2">
                        Created
                        <svg className={`w-4 h-4 transition-transform ${sort.key === 'created' && sort.dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...items].sort((a: any, b: any) => {
                    if (sort.key === 'email') {
                      return sort.dir === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
                    }
                    const at = new Date(a.created_at).getTime();
                    const bt = new Date(b.created_at).getTime();
                    return sort.dir === 'asc' ? at - bt : bt - at;
                  }).map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          aria-label="Select row" 
                          checked={selected.includes(c.id)} 
                          onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter(id => id !== c.id))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-3 font-medium text-gray-900">{c.email}</td>
                      <td className="p-3 text-gray-700">{c.fields?.first_name || '-'}</td>
                      <td className="p-3 text-gray-600">{new Date(c.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                <span>Page {page} of {totalPages}</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages, page - 2 + i));
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-2 py-1 rounded text-xs ${
                            pageNum === page 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <button 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </Card>
      </div>
      
      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showDeleteUploadModal}
        onClose={() => setShowDeleteUploadModal(false)}
        onConfirm={() => {
          if (deleteAction) {
            deleteAction();
          }
        }}
        title="Confirm Upload Deletion"
        message={deleteMessage}
        confirmText="Delete Upload"
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
        title="Confirm Contacts Deletion"
        message={deleteMessage}
        confirmText="Delete Contacts"
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
        title="Confirm Selected Contacts Deletion"
        message={deleteMessage}
        confirmText="Delete Selected"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}


