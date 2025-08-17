'use client';

import { Card } from '@/components/ui';
import { useEffect, useState } from 'react';

interface PlanLimits {
  templates: { used: number; total: number; remaining: number };
  uploads: { used: number; total: number; remaining: number };
  contacts: { used: number; total: number; remaining: number };
  campaigns: { used: number; total: number; remaining: number };
  emails: { used: number; total: number; remaining: number };
}

export function PlanUsageCard() {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLimits() {
      try {
        // Fetch from multiple endpoints
        const [templatesRes, uploadsRes, campaignsRes] = await Promise.all([
          fetch('/api/templates'),
          fetch('/api/uploads'),
          fetch('/api/campaigns')
        ]);

        const templatesData = await templatesRes.json();
        const uploadsData = await uploadsRes.json();
        const campaignsData = await campaignsRes.json();

        setLimits({
          templates: templatesData.limits || { used: 0, total: -1, remaining: -1 },
          uploads: uploadsData.limits || { used: 0, total: -1, remaining: -1 },
          contacts: { used: 0, total: -1, remaining: -1 }, // Will be updated separately
          campaigns: campaignsData.limits?.campaigns || { used: 0, total: -1, remaining: -1 },
          emails: campaignsData.limits?.emails || { used: 0, total: -1, remaining: -1 }
        });
      } catch (error) {
        console.error('Error fetching plan limits:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLimits();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!limits) return null;

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toLocaleString();
  };

  const getPercentage = (used: number, total: number) => {
    if (total === -1) return 0;
    return Math.min(100, (used / total) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const resources = [
    { name: 'Templates', ...limits.templates, icon: '📄' },
    { name: 'Uploads', ...limits.uploads, icon: '📊' },
    { name: 'Campaigns', ...limits.campaigns, icon: '📨' },
    { name: 'Emails (Monthly)', ...limits.emails, icon: '✉️' }
  ];

  const hasLimitedResources = resources.some(r => r.total !== -1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Plan Usage</h3>
        <a 
          href="/pricing" 
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Upgrade Plan →
        </a>
      </div>

      {hasLimitedResources ? (
        <div className="space-y-4">
          {resources.map((resource) => {
            const percentage = getPercentage(resource.used, resource.total);
            const showWarning = resource.total !== -1 && percentage >= 75;

            return (
              <div key={resource.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{resource.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{resource.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {resource.used.toLocaleString()} / {formatLimit(resource.total)}
                  </span>
                </div>
                {resource.total !== -1 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getProgressColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {showWarning && (
                      <p className="text-xs text-orange-600 mt-1">
                        {percentage >= 90 ? '⚠️ Limit almost reached!' : '⚡ Running low'}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🚀</div>
          <p className="text-gray-600 font-medium">Unlimited Plan</p>
          <p className="text-sm text-gray-500 mt-1">
            You have unlimited access to all resources
          </p>
        </div>
      )}

      {hasLimitedResources && resources.some(r => r.total !== -1 && getPercentage(r.used, r.total) >= 75) && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-800">
            <span className="font-semibold">Need more resources?</span> Upgrade your plan for higher limits and unlock premium features.
          </p>
          <a 
            href="/pricing" 
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Plans
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      )}
    </Card>
  );
}