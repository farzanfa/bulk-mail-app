"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Section, Card, Button, Input } from '@/components/ui';
import ConfirmModal from '@/components/ConfirmModal';

interface User {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role?: string;
  created_at: string;
  onboarding_completed_at?: string;
  last_login?: string;
  uploads_count: number;
  templates_count: number;
  campaigns_count: number;
  contacts_count: number;
}

interface SystemStats {
  totalUsers: number;
  totalUploads: number;
  totalTemplates: number;
  totalCampaigns: number;
  totalContacts: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  activeUsers24h: number;
  newUsers24h: number;
  uploads24h: number;
  campaigns24h: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  emailDeliveryRate: number;
  avgResponseTime: number;
  diskUsage: number;
  memoryUsage: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'campaign_launch' | 'email_sent' | 'system_alert' | 'user_login';
  description: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error';
  userId?: string;
  userEmail?: string;
}

interface CampaignPerformance {
  id: string;
  name: string;
  status: string;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
  bounceRate: number;
  avgOpenRate: number;
  avgClickRate: number;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'email'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'campaigns' | 'system' | 'activity'>('overview');
  const pageSize = 20;

  useEffect(() => {
    loadAdminData();
  }, [currentPage, sortBy, sortDir]);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [usersRes, statsRes, activityRes, campaignsRes] = await Promise.all([
        fetch(`/api/admin/users?page=${currentPage}&sortBy=${sortBy}&sortDir=${sortDir}&search=${encodeURIComponent(searchTerm)}`),
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity'),
        fetch('/api/admin/campaigns/performance')
      ]);

      if (!usersRes.ok || !statsRes.ok) {
        throw new Error('Failed to load admin data');
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const activityData = await activityRes.json();
      const campaignsData = await campaignsRes.json();

      setUsers(usersData.users || []);
      setTotalPages(Math.ceil(usersData.total / pageSize));
      setStats(statsData);
      setRecentActivity(activityData.activities || []);
      setCampaignPerformance(campaignsData.campaigns || []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    setCurrentPage(1);
    loadAdminData();
  };

  const handleSort = (field: 'created_at' | 'email') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const selectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    
    setDeleteMessage(`Are you sure you want to delete ${selectedUsers.length} user(s) and all their data? This action cannot be undone.`);
    setDeleteAction(() => async () => {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedUsers })
        });

        if (!res.ok) {
          throw new Error('Failed to delete users');
        }

        toast.success(`Successfully deleted ${selectedUsers.length} user(s)`);
        setSelectedUsers([]);
        await loadAdminData();
      } catch (err: any) {
        console.error('Failed to delete users:', err);
        toast.error('Failed to delete users');
      }
    });
    setShowDeleteModal(true);
  };

  const handleUserDelete = (userId: string) => {
    setDeleteMessage('Are you sure you want to delete this user and all their data? This action cannot be undone.');
    setDeleteAction(() => async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          throw new Error('Failed to delete user');
        }

        toast.success('User deleted successfully');
        await loadAdminData();
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        toast.error('Failed to delete user');
      }
    });
    setShowDeleteModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, monitor system performance, and oversee operations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'campaigns', label: 'Campaigns', icon: '📧' },
            { id: 'system', label: 'System', icon: '⚙️' },
            { id: 'activity', label: 'Activity', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-purple-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* System Statistics */}
        {stats && (
          <div className="space-y-6">
            {/* System Health Status */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  stats.systemHealth === 'healthy' ? 'bg-green-100 text-green-800' :
                  stats.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    stats.systemHealth === 'healthy' ? 'bg-green-500' :
                    stats.systemHealth === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  {stats.systemHealth === 'healthy' ? 'Healthy' : 
                   stats.systemHealth === 'warning' ? 'Warning' : 'Critical'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                  <div className="text-xs text-green-600">+{stats.newUsers24h} today</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalUploads.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Uploads</div>
                  <div className="text-xs text-green-600">+{stats.uploads24h} today</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{stats.totalCampaigns.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Campaigns</div>
                  <div className="text-xs text-green-600">+{stats.campaigns24h} today</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{stats.totalEmailsSent.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Emails Sent</div>
                  <div className="text-xs text-red-600">{stats.totalEmailsFailed} failed</div>
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="text-2xl font-bold text-emerald-600 mb-2">{stats.emailDeliveryRate?.toFixed(1) || '0'}%</div>
                <div className="text-sm text-gray-600">Delivery Rate</div>
                <div className="text-xs text-gray-500">Email success rate</div>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="text-2xl font-bold text-indigo-600 mb-2">{stats.avgResponseTime?.toFixed(0) || '0'}ms</div>
                <div className="text-sm text-gray-600">Avg Response</div>
                <div className="text-xs text-gray-500">System response time</div>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="text-2xl font-bold text-amber-600 mb-2">{stats.diskUsage?.toFixed(1) || '0'}%</div>
                <div className="text-sm text-gray-600">Disk Usage</div>
                <div className="text-xs text-gray-500">Storage utilization</div>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="text-2xl font-bold text-rose-600 mb-2">{stats.memoryUsage?.toFixed(1) || '0'}%</div>
                <div className="text-sm text-gray-600">Memory Usage</div>
                <div className="text-xs text-gray-500">RAM utilization</div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* System Statistics are already shown above */}
          </>
        )}

        {activeTab === 'users' && (
          <Section title="User Management">
            <Card className="p-6">
              {/* Search and Actions */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <Input
                      type="text"
                      placeholder="Search users by email, name, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-center lg:justify-end">
                  <button
                    onClick={selectAll}
                    className="px-4 sm:px-5 py-2.5 text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedUsers.length === 0}
                    className="px-4 sm:px-5 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                  >
                    Delete Selected ({selectedUsers.length})
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto table-responsive rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-left">
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length} 
                          onChange={selectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th 
                        className="p-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-2">
                          Email
                          <svg className={`w-4 h-4 transition-transform ${sortBy === 'email' && sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </div>
                      </th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Company</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Uploads</th>
                      <th className="p-3 text-left">Templates</th>
                      <th className="p-3 text-left">Campaigns</th>
                      <th className="p-3 text-left">Contacts</th>
                      <th 
                        className="p-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center gap-2">
                          Joined
                          <svg className={`w-4 h-4 transition-transform ${sortBy === 'created_at' && sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </div>
                      </th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            checked={selectedUsers.includes(user.id)} 
                            onChange={(e) => setSelectedUsers(e.target.checked ? [...selectedUsers, user.id] : selectedUsers.filter(id => id !== user.id))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 font-medium text-gray-900">{user.email}</td>
                        <td className="p-3 text-gray-700">{user.full_name || '-'}</td>
                        <td className="p-3 text-gray-700">{user.company || '-'}</td>
                        <td className="p-3 text-gray-700">{user.role || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.onboarding_completed_at 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.onboarding_completed_at ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-700">{user.uploads_count}</td>
                        <td className="p-3 text-gray-700">{user.templates_count}</td>
                        <td className="p-3 text-gray-700">{user.campaigns_count}</td>
                        <td className="p-3 text-gray-700">{user.contacts_count}</td>
                        <td className="p-3 text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleUserDelete(user.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-600 mt-6 pt-4 border-t border-gray-200">
                  <button 
                    disabled={currentPage <= 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 py-1 rounded text-xs ${
                              pageNum === currentPage 
                                ? 'bg-blue-600 text-white' 
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
                    disabled={currentPage >= totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </Card>
          </Section>
        )}

        {activeTab === 'campaigns' && (
          <Section title="Campaign Performance">
            <Card className="p-6">
              <div className="overflow-x-auto table-responsive rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-left">Campaign</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Sent</th>
                      <th className="p-3 text-left">Failed</th>
                      <th className="p-3 text-left">Opened</th>
                      <th className="p-3 text-left">Clicked</th>
                      <th className="p-3 text-left">Bounce Rate</th>
                      <th className="p-3 text-left">Open Rate</th>
                      <th className="p-3 text-left">Click Rate</th>
                      <th className="p-3 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPerformance.map(campaign => (
                      <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium text-gray-900">{campaign.name}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-700">{campaign.sent}</td>
                        <td className="p-3 text-gray-700">{campaign.failed}</td>
                        <td className="p-3 text-gray-700">{campaign.opened}</td>
                        <td className="p-3 text-gray-700">{campaign.clicked}</td>
                        <td className="p-3 text-gray-700">{campaign.bounceRate?.toFixed(1) || '0'}%</td>
                        <td className="p-3 text-gray-700">{campaign.avgOpenRate?.toFixed(1) || '0'}%</td>
                        <td className="p-3 text-gray-700">{campaign.avgClickRate?.toFixed(1) || '0'}%</td>
                        <td className="p-3 text-gray-600">
                          {new Date(campaign.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
        )}

        {activeTab === 'system' && (
          <Section title="System Settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gmail API Status</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rate Limiting</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bounce Handling</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">2FA Required</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Optional
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Session Timeout</span>
                    <span className="text-sm text-gray-900">24 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">IP Whitelist</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Disabled
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </Section>
        )}

        {activeTab === 'activity' && (
          <Section title="Recent Activity">
            <Card className="p-6">
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.severity === 'error' ? 'bg-red-500' :
                      activity.severity === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                        {activity.userEmail && (
                          <span className="text-xs text-gray-400">• {activity.userEmail}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            </Card>
          </Section>
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


