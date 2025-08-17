import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, Section } from '@/components/ui';
import { StatusBadge } from '@/components/status';
import { CampaignNewModal } from '@/components/CampaignNewModal';
import { PlanUsageCard } from '@/components/PlanUsageCard';
import { Suspense } from 'react';
import { getUserPlan } from '@/lib/plan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  
  if (!userId) {
    redirect('/login');
  }
  
  // Check if user needs onboarding from database
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { onboarding_completed_at: true }
  });
  
  if (!user?.onboarding_completed_at) {
    redirect('/onboarding');
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    googleCount,
    totalContacts,
    totalTemplates,
    totalCampaigns,
    recentCampaigns,
    sentByDay,
    sent24h,
    failed24h,
    pendingQueue
  ] = await Promise.all([
    prisma.google_accounts.count({ where: { user_id: userId! } }),
    prisma.contacts.count({ where: { user_id: userId! } }),
    prisma.templates.count({ where: { user_id: userId! } }),
    prisma.campaigns.count({ where: { user_id: userId! } }),
    prisma.campaigns.findMany({ where: { user_id: userId! }, orderBy: { created_at: 'desc' }, take: 6 }),
    prisma.campaign_recipients.groupBy({
      by: ['created_at'],
      _count: { _all: true },
      where: { status: 'sent', campaign: { user_id: userId! }, created_at: { gte: since } }
    }),
    prisma.campaign_recipients.count({ where: { status: 'sent', campaign: { user_id: userId! }, created_at: { gte: since24h } } }),
    prisma.campaign_recipients.count({ where: { status: 'failed', campaign: { user_id: userId! }, created_at: { gte: since24h } } }),
    prisma.campaign_recipients.count({ where: { status: 'pending', campaign: { user_id: userId!, status: 'running' } } })
  ]);

  // Get user plan for Gmail account restrictions
  const userPlan = await getUserPlan(userId!);

  // Build 7-day series (UTC days)
  const dayCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return { day: new Date(d), count: 0 };
  });
  for (const row of sentByDay) {
    const d = new Date(row.created_at as unknown as Date);
    d.setUTCHours(0, 0, 0, 0);
    const idx = dayCounts.findIndex(x => x.day.getTime() === d.getTime());
    if (idx >= 0) dayCounts[idx].count += (row._count as any)._all as number;
  }

  const max = Math.max(1, ...dayCounts.map(d => d.count));
  const points = dayCounts.map((d, i) => `${(i / 6) * 100},${100 - (d.count / max) * 100}`).join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your email campaigns
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a 
              href="/campaigns" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Campaigns
            </a>
            <a 
              href="/uploads" 
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Uploads
            </a>
            <a 
              href="/templates" 
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Templates
            </a>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-xl transition-all duration-300 group hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {googleCount > 0 ? (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Connected
                </div>
              ) : (
                <a href="/api/google/oauth/url?redirect=1" className="text-blue-600 text-xs font-medium hover:text-blue-700">
                  Connect
                </a>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{googleCount}</div>
            <div className="text-sm text-gray-600">Google Accounts</div>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 group hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalCampaigns}</div>
            <div className="text-sm text-gray-600">Total Campaigns</div>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 group hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalContacts}</div>
            <div className="text-sm text-gray-600">Total Contacts</div>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 group hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalTemplates}</div>
            <div className="text-sm text-gray-600">Email Templates</div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Sent (24h)</div>
                <div className="text-2xl font-bold text-gray-900">{sent24h}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (sent24h / Math.max(1, totalContacts)) * 100)}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Failed (24h)</div>
                <div className="text-2xl font-bold text-gray-900">{failed24h}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (failed24h / Math.max(1, sent24h + failed24h)) * 100)}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Pending Queue</div>
                <div className="text-2xl font-bold text-gray-900">{pendingQueue}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (pendingQueue / Math.max(1, totalContacts)) * 100)}%` }}
              ></div>
            </div>
          </Card>
        </div>

        {/* Plan Usage */}
        <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>}>
          <PlanUsageCard />
        </Suspense>

        {/* Analytics Chart */}
        <Card className="p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Email Activity (Last 7 Days)</h3>
              <p className="text-sm text-gray-600">Daily email sending trends</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Sent emails</span>
              </div>
              <div className="text-xs">
                Max: {max}
              </div>
            </div>
          </div>
          <div className="relative">
            <svg viewBox="0 0 100 100" className="w-full h-48 sm:h-32">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <polyline 
                fill="url(#chartGradient)" 
                stroke="#3b82f6" 
                strokeWidth="3" 
                points={points} 
                className="drop-shadow-lg"
              />
              <polyline 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3" 
                points={points} 
                className="drop-shadow-lg"
              />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
              {dayCounts.map((d, i) => (
                <div key={i} className="text-center">
                  <div className="font-medium">{d.count}</div>
                  <div>{d.day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Campaigns */}
        <Section title="Recent Campaigns" actions={<a href="/campaigns" className="text-sm text-purple-600 hover:text-purple-700 font-medium">View all campaigns →</a>}>
          {recentCampaigns.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-6">Create your first campaign to get started with email marketing</p>
              <a 
                href="/campaigns/new" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Campaign
              </a>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentCampaigns.map((c: any) => (
                <a key={c.id} href={`/campaigns/${c.id}`} className="block group">
                  <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-transparent group-hover:border-purple-200">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate mb-1">
                          {c.name || `Campaign ${c.id.slice(0, 8)}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(c.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <StatusBadge value={c.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">View details</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </Section>

        {/* Quick Actions */}
        <Card className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to get started?</h3>
            <p className="text-gray-600">Quick actions to help you manage your email campaigns</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/campaigns/new" 
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Campaign
            </a>
            <a 
              href="/uploads" 
              className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload CSV
            </a>
            <a 
              href="/templates" 
              className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Manage Templates
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}


