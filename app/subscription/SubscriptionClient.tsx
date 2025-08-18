'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SubscriptionClientProps {
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
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

interface UsageStats {
  emails_sent_this_month: number;
  contacts_count: number;
  templates_count: number;
  campaigns_count: number;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export default function SubscriptionClient({ userEmail }: SubscriptionClientProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const [subResponse, usageResponse, paymentResponse] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/subscription/usage'),
        fetch('/api/subscription/payment-methods'),
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData);
      }

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPaymentMethods(paymentData.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchSubscriptionData();
        setShowCancelModal(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/subscription/resume', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchSubscriptionData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to resume subscription');
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert('Failed to resume subscription');
    } finally {
      setIsUpdating(false);
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
        return 'text-green-700 bg-green-50 border-green-200';
      case 'trialing':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'expired':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Subscription</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">No active subscription found.</p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Subscription</h1>
          <p className="mt-2 text-gray-600">
            Manage your subscription plan, billing details, and payment methods
          </p>
        </div>

        {/* Current Plan Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(subscription.status)}`}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plan Details */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{subscription.plan.name}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${subscription.plan.price_monthly}
                  <span className="text-base font-normal text-gray-500">/month</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  or ${subscription.plan.price_yearly}/year (save ${(subscription.plan.price_monthly * 12 - subscription.plan.price_yearly).toFixed(2)})
                </p>
              </div>

              {/* Billing Period */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Current Billing Period</h4>
                <p className="text-gray-600">
                  {format(new Date(subscription.current_period_start), 'MMMM d, yyyy')} - {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                </p>
                {subscription.cancel_at_period_end && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Your subscription will end on {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                <>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Change Plan
                  </Link>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={isUpdating}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    Cancel Subscription
                  </button>
                </>
              )}
              {subscription.cancel_at_period_end && (
                <button
                  onClick={handleResumeSubscription}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Processing...' : 'Resume Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        {usage && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Usage This Month</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Emails */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Emails Sent</span>
                  <span className="text-sm text-gray-900">
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
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Contacts</span>
                  <span className="text-sm text-gray-900">
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
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Templates</span>
                  <span className="text-sm text-gray-900">
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
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Campaigns</span>
                  <span className="text-sm text-gray-900">
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
          </div>
        )}

        {/* Plan Features */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Plan Features</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatLimit(subscription.plan.team_members)} Team Members</p>
                  <p className="text-xs text-gray-500">Collaborate with your team</p>
                </div>
              </div>

              {subscription.plan.custom_branding && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Custom Branding</p>
                    <p className="text-xs text-gray-500">Remove our branding from emails</p>
                  </div>
                </div>
              )}

              {subscription.plan.priority_support && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Priority Support</p>
                    <p className="text-xs text-gray-500">Get help when you need it</p>
                  </div>
                </div>
              )}

              {subscription.plan.api_access && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">API Access</p>
                    <p className="text-xs text-gray-500">Integrate with your tools</p>
                  </div>
                </div>
              )}

              {subscription.plan.advanced_analytics && (
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Advanced Analytics</p>
                    <p className="text-xs text-gray-500">Detailed campaign insights</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Add Payment Method
              </button>
            </div>
          </div>
          <div className="p-6">
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center mr-4">
                        <span className="text-xs font-medium text-gray-600">{method.brand}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          •••• {method.last4}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires {method.exp_month}/{method.exp_year}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.is_default && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                      <button className="text-sm text-gray-500 hover:text-gray-700">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No payment methods on file. Add a payment method to upgrade your plan.
              </p>
            )}
          </div>
        </div>

        {/* Billing History Link */}
        <div className="mt-6 text-center">
          <Link href="/subscription/billing-history" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View Billing History →
          </Link>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCancelModal(false)} />
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Subscription</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to cancel your subscription? You'll continue to have access to your current plan until {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        You can resume your subscription at any time before it expires.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={isUpdating}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isUpdating ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isUpdating}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}