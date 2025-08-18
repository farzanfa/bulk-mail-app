"use client";
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Section, Card, Button, Input, PrimaryButton, SecondaryButton } from '@/components/ui';
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

interface FilterOptions {
  status?: string;
  dateRange?: string;
  minActivity?: number;
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    loadAdminData();
  }, [currentPage, sortBy, sortDir]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAdminData();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

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
      toast.error('Failed to load admin data. Please try again.');
      // Set default empty values to prevent errors
      setUsers([]);
      setStats({
        totalUsers: 0,
        totalUploads: 0,
        totalTemplates: 0,
        totalCampaigns: 0,
        totalContacts: 0,
        totalEmailsSent: 0,
        totalEmailsFailed: 0,
        activeUsers24h: 0,
        newUsers24h: 0,
        uploads24h: 0,
        campaigns24h: 0,
        systemHealth: 'healthy' as const,
        emailDeliveryRate: 0,
        avgResponseTime: 0,
        diskUsage: 0,
        memoryUsage: 0
      });
      setRecentActivity([]);
      setCampaignPerformance([]);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-lg font-medium text-gray-700 mt-6">Loading admin dashboard</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Export functions
  const exportUserData = useCallback(() => {
    const csvContent = [
      ['Email', 'Name', 'Company', 'Role', 'Status', 'Uploads', 'Templates', 'Campaigns', 'Contacts', 'Joined'],
      ...users.map(user => [
        user.email,
        user.full_name || '-',
        user.company || '-',
        user.role || '-',
        user.onboarding_completed_at ? 'Active' : 'Pending',
        user.uploads_count,
        user.templates_count,
        user.campaigns_count,
        user.contacts_count,
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('User data exported successfully');
  }, [users]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header with Actions */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage users, monitor system performance, and oversee operations</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '🔄 Auto-refresh OFF'}
              </button>
              <button
                onClick={loadAdminData}
                className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">Menu: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            <svg className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Tab Navigation - Improved for mobile */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:block bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6 sm:mb-8`}>
          <div className="flex flex-col sm:flex-row gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'campaigns', label: 'Campaigns', icon: '📧' },
              { id: 'system', label: 'System', icon: '⚙️' },
              { id: 'activity', label: 'Activity', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2.5 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <svg className="w-4 h-4 ml-auto sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* System Statistics */}
        {stats && (
          <div className="space-y-6">
            {/* System Health Status - Enhanced UI */}
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">System Overview</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                  stats.systemHealth === 'healthy' ? 'bg-green-100 text-green-800 ring-2 ring-green-200' :
                  stats.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-200' :
                  'bg-red-100 text-red-800 ring-2 ring-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    stats.systemHealth === 'healthy' ? 'bg-green-500' :
                    stats.systemHealth === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  {stats.systemHealth === 'healthy' ? 'All Systems Operational' : 
                   stats.systemHealth === 'warning' ? 'Degraded Performance' : 'Critical Issues'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center transform hover:scale-105 transition-transform duration-200">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700">Total Users</div>
                  <div className="text-xs text-green-600 font-medium mt-1">+{stats.newUsers24h} today</div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-3 sm:p-4 text-center transform hover:scale-105 transition-transform duration-200">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">{stats.totalUploads.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700">Total Uploads</div>
                  <div className="text-xs text-green-600 font-medium mt-1">+{stats.uploads24h} today</div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-3 sm:p-4 text-center transform hover:scale-105 transition-transform duration-200">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1">{stats.totalCampaigns.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700">Total Campaigns</div>
                  <div className="text-xs text-green-600 font-medium mt-1">+{stats.campaigns24h} today</div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-3 sm:p-4 text-center transform hover:scale-105 transition-transform duration-200">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-1">{stats.totalEmailsSent.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700">Emails Sent</div>
                  <div className="text-xs text-red-600 font-medium mt-1">{stats.totalEmailsFailed} failed</div>
                </div>
              </div>
            </Card>

            {/* Performance Metrics - Enhanced Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="p-4 sm:p-6 text-center bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:shadow-lg transition-all duration-300 hover:border-emerald-300">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600 mb-1">{stats.emailDeliveryRate?.toFixed(1) || '0'}%</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700">Delivery Rate</div>
                <div className="text-xs text-gray-500 mt-1">Email success rate</div>
              </Card>
              
              <Card className="p-4 sm:p-6 text-center bg-gradient-to-br from-indigo-50 to-white border-indigo-200 hover:shadow-lg transition-all duration-300 hover:border-indigo-300">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-600 mb-1">{stats.avgResponseTime?.toFixed(0) || '0'}ms</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700">Avg Response</div>
                <div className="text-xs text-gray-500 mt-1">System response time</div>
              </Card>
              
              <Card className="p-4 sm:p-6 text-center bg-gradient-to-br from-amber-50 to-white border-amber-200 hover:shadow-lg transition-all duration-300 hover:border-amber-300">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600 mb-1">{stats.diskUsage?.toFixed(1) || '0'}%</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700">Disk Usage</div>
                <div className="text-xs text-gray-500 mt-1">Storage utilization</div>
                <div className="mt-2">
                  <div className="w-full bg-amber-100 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.diskUsage}%` }}></div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 sm:p-6 text-center bg-gradient-to-br from-rose-50 to-white border-rose-200 hover:shadow-lg transition-all duration-300 hover:border-rose-300">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-rose-600 mb-1">{stats.memoryUsage?.toFixed(1) || '0'}%</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700">Memory Usage</div>
                <div className="text-xs text-gray-500 mt-1">RAM utilization</div>
                <div className="mt-2">
                  <div className="w-full bg-rose-100 rounded-full h-2">
                    <div className="bg-rose-600 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.memoryUsage}%` }}></div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Analytics Chart */}
            <Card className="p-4 sm:p-6 bg-white shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Activity Overview</h3>
              <div className="space-y-4">
                {/* Simple CSS-based chart */}
                <div className="flex items-end justify-between gap-2 h-48">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const height = Math.random() * 80 + 20; // Mock data
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gray-100 rounded-t-lg relative flex items-end" style={{ height: '100%' }}>
                          <div 
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500"
                            style={{ height: `${height}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 hover:opacity-100 transition-opacity">
                              {Math.round(height * 10)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{day}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span className="text-sm text-gray-600">User Activity</span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => setActiveTab('users')}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">Manage Users</h4>
                <p className="text-sm text-gray-600 mt-1">View and manage all users</p>
              </button>
              
              <button 
                onClick={() => {
                  toast.info('Reports feature coming soon!');
                }}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-lg transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">View Reports</h4>
                <p className="text-sm text-gray-600 mt-1">Analytics and insights</p>
              </button>
              
              <button 
                onClick={() => setActiveTab('system')}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">System Config</h4>
                <p className="text-sm text-gray-600 mt-1">Configure system settings</p>
              </button>
              
              <button 
                onClick={() => setActiveTab('activity')}
                className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-lg transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">Activity Logs</h4>
                <p className="text-sm text-gray-600 mt-1">View system activity</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
              <button
                onClick={exportUserData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Users
              </button>
            </div>
            
            <Card className="p-4 sm:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
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
                        placeholder="Search users by email, name, or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10 w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </button>
                    
                    <button
                      onClick={selectAll}
                      className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-white font-medium rounded-lg transition-all duration-200"
                    >
                      {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                    </button>
                    
                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedUsers.length === 0}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete ({selectedUsers.length})
                    </button>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{filteredUsers.length}</div>
                    <div className="text-xs text-gray-600">Filtered Users</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {filteredUsers.filter(u => u.onboarding_completed_at).length}
                    </div>
                    <div className="text-xs text-gray-600">Active Users</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {filteredUsers.filter(u => !u.onboarding_completed_at).length}
                    </div>
                    <div className="text-xs text-gray-600">Pending Users</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-600">{selectedUsers.length}</div>
                    <div className="text-xs text-gray-600">Selected</div>
                  </div>
                </div>
              </div>

              {/* Users Table - Responsive */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="p-3 text-left sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10">
                          <input 
                            type="checkbox" 
                            checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length} 
                            onChange={selectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-200 transition-colors font-semibold text-gray-700"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-2">
                            Email
                            <svg className={`w-4 h-4 transition-transform ${sortBy === 'email' && sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                            </svg>
                          </div>
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-700 hidden sm:table-cell">Name</th>
                        <th className="p-3 text-left font-semibold text-gray-700 hidden lg:table-cell">Company</th>
                        <th className="p-3 text-left font-semibold text-gray-700 hidden lg:table-cell">Role</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="p-3 text-left font-semibold text-gray-700 hidden md:table-cell">Activity</th>
                        <th 
                          className="p-3 text-left cursor-pointer hover:bg-gray-200 transition-colors font-semibold text-gray-700"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Joined
                            <svg className={`w-4 h-4 transition-transform ${sortBy === 'created_at' && sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                            </svg>
                          </div>
                        </th>
                        <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((user, index) => (
                        <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="p-3 sticky left-0 bg-inherit">
                            <input 
                              type="checkbox" 
                              checked={selectedUsers.includes(user.id)} 
                              onChange={(e) => setSelectedUsers(e.target.checked ? [...selectedUsers, user.id] : selectedUsers.filter(id => id !== user.id))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{user.email}</span>
                              <span className="text-xs text-gray-500 sm:hidden">{user.full_name || 'No name'}</span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-700 hidden sm:table-cell">{user.full_name || '-'}</td>
                          <td className="p-3 text-gray-700 hidden lg:table-cell">{user.company || '-'}</td>
                          <td className="p-3 text-gray-700 hidden lg:table-cell">{user.role || '-'}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.onboarding_completed_at 
                                ? 'bg-green-100 text-green-800 ring-1 ring-green-200' 
                                : 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200'
                            }`}>
                              {user.onboarding_completed_at ? '✓ Active' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-gray-700">{user.uploads_count}</span>
                                <span className="text-gray-500">Uploads</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-semibold text-gray-700">{user.campaigns_count}</span>
                                <span className="text-gray-500">Campaigns</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {new Date(user.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(user.created_at).getFullYear()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUserDelete(user.id)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete user"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-gray-500">
                            No users found matching your search criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination - Enhanced Mobile UI */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage <= 1} 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600 sm:hidden">Page {currentPage}/{totalPages}</span>
                      <span className="hidden sm:block text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                    </div>
                    
                    <button 
                      disabled={currentPage >= totalPages} 
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            pageNum === currentPage 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, users.length)} of {users.length} users
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Campaign Performance</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const csvContent = [
                      ['Campaign', 'Status', 'Sent', 'Failed', 'Opened', 'Clicked', 'Bounce Rate', 'Open Rate', 'Click Rate', 'Created'],
                      ...campaignPerformance.map(c => [
                        c.name,
                        c.status,
                        c.sent,
                        c.failed,
                        c.opened,
                        c.clicked,
                        `${c.bounceRate?.toFixed(1) || '0'}%`,
                        `${c.avgOpenRate?.toFixed(1) || '0'}%`,
                        `${c.avgClickRate?.toFixed(1) || '0'}%`,
                        new Date(c.createdAt).toLocaleDateString()
                      ])
                    ].map(row => row.join(',')).join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `campaign-performance-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.success('Campaign data exported successfully');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Data
                </button>
              </div>
            </div>
            
            {/* Campaign Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{campaignPerformance.length}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Campaigns</div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {campaignPerformance.filter(c => c.status === 'completed').length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Completed</div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {campaignPerformance.filter(c => c.status === 'running').length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Running</div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {campaignPerformance.reduce((sum, c) => sum + c.sent, 0).toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Sent</div>
                </div>
              </Card>
            </div>
            
            <Card className="p-4 sm:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="p-3 text-left font-semibold text-gray-700">Campaign</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="p-3 text-left font-semibold text-gray-700 hidden sm:table-cell">Performance</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Metrics</th>
                        <th className="p-3 text-left font-semibold text-gray-700">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {campaignPerformance.map((campaign, index) => (
                        <tr key={campaign.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{campaign.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">
                              Sent: {campaign.sent} | Failed: {campaign.failed}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              campaign.status === 'completed' ? 'bg-green-100 text-green-800 ring-1 ring-green-200' :
                              campaign.status === 'running' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-200' :
                              campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' :
                              'bg-gray-100 text-gray-800 ring-1 ring-gray-200'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                campaign.status === 'running' ? 'bg-blue-500 animate-pulse' : ''
                              }`}></div>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <div className="flex items-center gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Sent:</span>
                                <span className="font-semibold text-gray-700 ml-1">{campaign.sent.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Failed:</span>
                                <span className="font-semibold text-red-600 ml-1">{campaign.failed}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Open</span>
                                    <span className="font-semibold text-gray-700">{campaign.avgOpenRate?.toFixed(1) || '0'}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                                         style={{ width: `${campaign.avgOpenRate || 0}%` }}></div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Click</span>
                                    <span className="font-semibold text-gray-700">{campaign.avgClickRate?.toFixed(1) || '0'}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div className="bg-green-600 h-1.5 rounded-full transition-all duration-500" 
                                         style={{ width: `${campaign.avgClickRate || 0}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">
                            <div className="text-sm">
                              {new Date(campaign.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {campaignPerformance.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            No campaigns found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">System Configuration</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Email Configuration */}
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Email Configuration</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Gmail API Status</span>
                      <p className="text-xs text-gray-500 mt-0.5">Connected and operational</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ring-1 ring-green-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Rate Limiting</span>
                      <p className="text-xs text-gray-500 mt-0.5">250 emails/minute</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ring-1 ring-blue-200">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Bounce Handling</span>
                      <p className="text-xs text-gray-500 mt-0.5">Auto-remove invalid emails</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ring-1 ring-green-200">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">SMTP Backup</span>
                      <p className="text-xs text-gray-500 mt-0.5">Fallback email service</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200">
                      Standby
                    </span>
                  </div>
                </div>
              </Card>

              {/* Security Settings */}
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Security Settings</h3>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">2FA Required</span>
                      <p className="text-xs text-gray-500 mt-0.5">Two-factor authentication</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200">
                      Optional
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Session Timeout</span>
                      <p className="text-xs text-gray-500 mt-0.5">Auto-logout after inactivity</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">24 hours</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">IP Whitelist</span>
                      <p className="text-xs text-gray-500 mt-0.5">Restrict access by IP</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ring-1 ring-gray-200">
                      Disabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Password Policy</span>
                      <p className="text-xs text-gray-500 mt-0.5">Min 8 chars, mixed case</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ring-1 ring-green-200">
                      Enforced
                    </span>
                  </div>
                </div>
              </Card>

              {/* Database Settings */}
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-white border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Database Settings</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Auto Backup</span>
                      <p className="text-xs text-gray-500 mt-0.5">Daily at 3:00 AM UTC</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ring-1 ring-green-200">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Data Retention</span>
                      <p className="text-xs text-gray-500 mt-0.5">Keep backups for</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">30 days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Connection Pool</span>
                      <p className="text-xs text-gray-500 mt-0.5">Max connections</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">100</span>
                  </div>
                </div>
              </Card>

              {/* API Settings */}
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-white border-orange-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">API Settings</h3>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Rate Limiting</span>
                      <p className="text-xs text-gray-500 mt-0.5">Requests per minute</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">1000</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">API Version</span>
                      <p className="text-xs text-gray-500 mt-0.5">Current version</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">v2.0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">CORS</span>
                      <p className="text-xs text-gray-500 mt-0.5">Cross-origin requests</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ring-1 ring-green-200">
                      Enabled
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Activity Log</h2>
              <div className="flex items-center gap-2">
                <select 
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Activities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warnings</option>
                  <option value="error">Errors</option>
                </select>
                <button
                  onClick={() => {
                    const csvContent = [
                      ['Type', 'Description', 'User', 'Timestamp'],
                      ...recentActivity.map(a => [
                        a.type,
                        a.description,
                        a.userEmail || '-',
                        new Date(a.timestamp).toLocaleString()
                      ])
                    ].map(row => row.join(',')).join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.success('Activity log exported successfully');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Log
                </button>
              </div>
            </div>
            
            {/* Activity Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{recentActivity.length}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Events</div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {recentActivity.filter(a => a.severity === 'info').length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Info</div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {recentActivity.filter(a => a.severity === 'warning').length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Warnings</div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-red-50 to-white border-red-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {recentActivity.filter(a => a.severity === 'error').length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Errors</div>
                </div>
              </Card>
            </div>
            
            <Card className="p-4 sm:p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-3">
                {recentActivity
                  .filter(activity => !filters.status || activity.severity === filters.status)
                  .map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        activity.severity === 'error' ? 'border-red-200 bg-red-50/50 hover:bg-red-50' :
                        activity.severity === 'warning' ? 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-50' :
                        'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.severity === 'error' ? 'bg-red-100' :
                          activity.severity === 'warning' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {activity.type === 'user_signup' && (
                            <svg className={`w-5 h-5 ${
                              activity.severity === 'error' ? 'text-red-600' :
                              activity.severity === 'warning' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          )}
                          {activity.type === 'campaign_launch' && (
                            <svg className={`w-5 h-5 ${
                              activity.severity === 'error' ? 'text-red-600' :
                              activity.severity === 'warning' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
                          {activity.type === 'email_sent' && (
                            <svg className={`w-5 h-5 ${
                              activity.severity === 'error' ? 'text-red-600' :
                              activity.severity === 'warning' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                          {activity.type === 'system_alert' && (
                            <svg className={`w-5 h-5 ${
                              activity.severity === 'error' ? 'text-red-600' :
                              activity.severity === 'warning' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                          {activity.type === 'user_login' && (
                            <svg className={`w-5 h-5 ${
                              activity.severity === 'error' ? 'text-red-600' :
                              activity.severity === 'warning' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-xs text-gray-500">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                              {activity.userEmail && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                  {activity.userEmail}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                activity.severity === 'error' ? 'bg-red-100 text-red-700' :
                                activity.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {activity.type.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium mb-1">No recent activity</p>
                    <p className="text-sm">Activity events will appear here</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
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


