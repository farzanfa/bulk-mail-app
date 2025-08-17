import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, Section, PrimaryButton, SecondaryButton, Badge } from '@/components/ui';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section with consistent styling */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fadeInUp">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Welcome back! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                Here's what's happening with your email campaigns
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a 
                href="/campaigns" 
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Campaigns
              </a>
              <a 
                href="/uploads" 
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-purple-300 hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Uploads
              </a>
              <a 
                href="/templates" 
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-purple-300 hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Templates
              </a>
            </div>
          </div>
        </div>

        {/* Main Stats Grid with consistent card styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 group animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {googleCount > 0 ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <a href="/api/google/oauth/url?redirect=1" className="text-purple-600 text-sm font-semibold hover:text-purple-700 transition-colors">
                  Connect →
                </a>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{googleCount}</div>
            <div className="text-sm text-gray-600">Google Accounts</div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 group animate-fadeInUp" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalCampaigns}</div>
            <div className="text-sm text-gray-600">Total Campaigns</div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 group animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalContacts}</div>
            <div className="text-sm text-gray-600">Total Contacts</div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 group animate-fadeInUp" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalTemplates}</div>
            <div className="text-sm text-gray-600">Email Templates</div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-l-4 border-green-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 font-medium">Sent (24h)</div>
                <div className="text-2xl font-bold text-gray-900">{sent24h.toLocaleString()}</div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(100, (sent24h / Math.max(1, totalContacts)) * 100)}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-l-4 border-red-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 font-medium">Failed (24h)</div>
                <div className="text-2xl font-bold text-gray-900">{failed24h.toLocaleString()}</div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(100, (failed24h / Math.max(1, sent24h + failed24h)) * 100)}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-l-4 border-yellow-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 font-medium">Pending Queue</div>
                <div className="text-2xl font-bold text-gray-900">{pendingQueue.toLocaleString()}</div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(100, (pendingQueue / Math.max(1, totalContacts)) * 100)}%` }}
              ></div>
            </div>
          </Card>
        </div>

        {/* Plan Usage */}
        <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-2xl"></div>}>
          <div className="animate-fadeInUp" style={{ animationDelay: '250ms' }}>
            <PlanUsageCard />
          </div>
        </Suspense>

        {/* Analytics Chart */}
        <Card className="p-8 bg-white hover:shadow-lg transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Email Activity</h3>
              <p className="text-gray-600 mt-1">Daily email sending trends over the last 7 days</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600"></div>
                <span className="text-gray-600">Sent emails</span>
              </div>
              <Badge variant="primary">Max: {max.toLocaleString()}</Badge>
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
            <svg viewBox="0 0 100 100" className="w-full h-48 sm:h-40">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.05"/>
                </linearGradient>
              </defs>
              <polyline 
                fill="url(#chartGradient)" 
                stroke="rgb(147, 51, 234)" 
                strokeWidth="3" 
                points={`0,100 ${points} 100,100`}
                className="drop-shadow-md"
              />
              <polyline 
                fill="none" 
                stroke="rgb(147, 51, 234)" 
                strokeWidth="3" 
                points={points} 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-md"
              />
              {/* Data points */}
              {dayCounts.map((d, i) => (
                <circle
                  key={i}
                  cx={(i / 6) * 100}
                  cy={100 - (d.count / max) * 100}
                  r="4"
                  fill="white"
                  stroke="rgb(147, 51, 234)"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
              ))}
            </svg>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between text-xs text-gray-600 font-medium">
              {dayCounts.map((d, i) => (
                <div key={i} className="text-center">
                  <div className="font-bold text-gray-900">{d.count}</div>
                  <div className="mt-1">{d.day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Campaigns */}
        <Section 
          title="Recent Campaigns" 
          actions={
            <a href="/campaigns" className="text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors inline-flex items-center gap-1">
              View all 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          }
        >
          {recentCampaigns.length === 0 ? (
            <Card className="p-16 text-center bg-gradient-to-br from-gray-50 to-white">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Create your first campaign to get started with email marketing and reach your audience effectively.</p>
              <a 
                href="/campaigns/new" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Campaign
              </a>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentCampaigns.map((c: any) => (
                <a key={c.id} href={`/campaigns/${c.id}`} className="block group">
                  <Card className="p-6 h-full bg-white hover:shadow-lg group-hover:border-purple-200 border-2 border-transparent transition-all duration-300">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-lg truncate mb-2 group-hover:text-purple-600 transition-colors">
                          {c.name || `Campaign ${c.id.slice(0, 8)}`}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
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
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-all">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </Section>

        {/* Quick Actions */}
        <Card className="p-10 bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-100 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">Ready to grow your reach?</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Quick actions to help you manage your email campaigns effectively and reach your audience.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/campaigns/new" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Campaign
            </a>
            <a 
              href="/uploads" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-lg text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Contacts
            </a>
            <a 
              href="/templates" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-lg text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Browse Templates
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}


