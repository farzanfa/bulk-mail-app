'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface PlanDetailsProps {
  userEmail: string;
}

interface PlanInfo {
  name: string;
  type: string;
  price_monthly: number;
  price_yearly: number;
  emails_per_month: number;
  contacts_limit: number;
  templates_limit: number;
  campaigns_limit: number;
  team_members: number;
  custom_branding: boolean;
  priority_support: boolean;
  api_access: boolean;
  advanced_analytics: boolean;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: PlanInfo;
}

interface UsageStats {
  emails_sent_this_month: number;
  contacts_count: number;
  templates_count: number;
  campaigns_count: number;
}

export default function PlanDetails({ userEmail }: PlanDetailsProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [userEmail]);

  const fetchSubscriptionDetails = async () => {
    try {
      const [subResponse, usageResponse] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/subscription/usage'),
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData);
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.round((used / limit) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-50';
      case 'trialing':
        return 'text-blue-700 bg-blue-50';
      case 'cancelled':
        return 'text-red-700 bg-red-50';
      case 'expired':
        return 'text-gray-700 bg-gray-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
        <p className="text-gray-600">No active subscription found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Plan Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">{subscription.plan.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${subscription.plan.price_monthly}
            <span className="text-base font-normal text-gray-500">/month</span>
          </p>
        </div>

        {/* Billing Period */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">Current billing period</p>
          <p className="text-gray-900">
            {format(new Date(subscription.current_period_start), 'MMM d, yyyy')} -{' '}
            {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
          </p>
          {subscription.cancel_at_period_end && (
            <p className="text-sm text-red-600 mt-1">
              Subscription will cancel at period end
            </p>
          )}
        </div>

        {/* Usage Stats */}
        {usage && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Usage This Month</h4>
            
            {/* Emails */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Emails</span>
                <span className="text-gray-900">
                  {usage.emails_sent_this_month.toLocaleString()} / {formatLimit(subscription.plan.emails_per_month)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${getUsagePercentage(usage.emails_sent_this_month, subscription.plan.emails_per_month)}%`,
                  }}
                />
              </div>
            </div>

            {/* Contacts */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Contacts</span>
                <span className="text-gray-900">
                  {usage.contacts_count.toLocaleString()} / {formatLimit(subscription.plan.contacts_limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${getUsagePercentage(usage.contacts_count, subscription.plan.contacts_limit)}%`,
                  }}
                />
              </div>
            </div>

            {/* Templates */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Templates</span>
                <span className="text-gray-900">
                  {usage.templates_count} / {formatLimit(subscription.plan.templates_limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${getUsagePercentage(usage.templates_count, subscription.plan.templates_limit)}%`,
                  }}
                />
              </div>
            </div>

            {/* Campaigns */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Campaigns</span>
                <span className="text-gray-900">
                  {usage.campaigns_count} / {formatLimit(subscription.plan.campaigns_limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${getUsagePercentage(usage.campaigns_count, subscription.plan.campaigns_limit)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Plan Features</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {formatLimit(subscription.plan.team_members)} Team Members
            </li>
            {subscription.plan.custom_branding && (
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Custom Branding
              </li>
            )}
            {subscription.plan.priority_support && (
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority Support
              </li>
            )}
            {subscription.plan.api_access && (
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                API Access
              </li>
            )}
            {subscription.plan.advanced_analytics && (
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced Analytics
              </li>
            )}
          </ul>
        </div>

        {/* Manage Subscription Button */}
        <div className="border-t pt-4">
          <a href="/billing" className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm">
            Manage Billing & Subscription
          </a>
        </div>
      </div>
    </div>
  );
}