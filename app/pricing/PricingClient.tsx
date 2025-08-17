"use client";
import { Card } from '@/components/ui';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Plan {
  id: string;
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

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/subscription/plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  const getPrice = (plan: Plan) => {
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  };

  const getSavings = (plan: Plan) => {
    if (plan.price_monthly === 0) return 0;
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyTotal = plan.price_yearly;
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg">
            💰 Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Simple, transparent <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free, scale as you grow. All plans include secure Gmail integration. Cancel anytime with no hidden fees.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
              {plans.some(p => getSavings(p) > 0) && (
                <span className="ml-1 text-green-600">(Save up to {Math.max(...plans.map(getSavings))}%)</span>
              )}
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={`grid grid-cols-1 ${plans.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 max-w-6xl mx-auto`}>
          {plans.map((plan) => {
            const isPro = plan.type === 'professional';
            const isFree = plan.type === 'free';
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <Card 
                key={plan.id}
                className={`p-8 relative overflow-hidden hover:shadow-xl transition-all duration-300 group hover:scale-105 ${
                  isPro ? 'border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50' : ''
                }`}
              >
                {isPro && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name.replace(' Plan', '')}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      ${price}
                    </div>
                    <div className="text-gray-600">
                      per {billingCycle === 'monthly' ? 'month' : 'year'}
                    </div>
                    {billingCycle === 'yearly' && savings > 0 && (
                      <div className="text-sm text-green-600 mt-1">
                        Save {savings}%
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">
                        {formatLimit(plan.emails_per_month)} emails per month
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">
                        {formatLimit(plan.contacts_limit)} contacts
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">
                        {formatLimit(plan.templates_limit)} email templates
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">
                        {formatLimit(plan.campaigns_limit)} campaigns
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">
                        {formatLimit(plan.team_members)} team {plan.team_members === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    {plan.custom_branding && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700">Custom branding</span>
                      </div>
                    )}
                    {plan.api_access && (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700">API access</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">
                        {plan.advanced_analytics ? 'Advanced' : 'Basic'} analytics
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">
                        {plan.priority_support ? 'Priority' : 'Standard'} support
                      </span>
                    </div>
                  </div>
                  
                  {status === 'loading' ? (
                    <div className="w-full px-6 py-3 rounded-lg bg-gray-100 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                    </div>
                  ) : session?.user ? (
                    <a 
                      href={isFree ? "/dashboard" : `/dashboard/billing?plan=${plan.type}`}
                      className={`w-full px-6 py-3 rounded-lg font-semibold text-center block transition-all duration-200 shadow-lg hover:shadow-xl ${
                        isPro 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          : isFree
                          ? 'bg-gray-900 text-white hover:bg-gray-800'
                          : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isFree ? 'Go to Dashboard' : `Choose ${plan.name.replace(' Plan', '')}`}
                    </a>
                  ) : (
                    <button 
                      className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                        isPro 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          : isFree
                          ? 'bg-gray-900 text-white hover:bg-gray-800'
                          : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                    >
                      {isFree ? 'Get started for free' : `Get ${plan.name.replace(' Plan', '')}`}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-6">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Frequently asked questions</h3>
            <div className="space-y-4 text-left">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Can I change plans later?</h4>
                <p className="text-gray-600 text-sm">Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">What happens if I exceed my limits?</h4>
                <p className="text-gray-600 text-sm">We'll notify you when you're approaching limits. You can upgrade your plan or wait until the next billing cycle.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">How many Gmail accounts can I connect?</h4>
                <p className="text-gray-600 text-sm">All plans currently support 1 Gmail account. Multi-account support is coming soon for Professional and Enterprise plans.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Is there a setup fee?</h4>
                <p className="text-gray-600 text-sm">No setup fees, no hidden costs. You only pay for what you use with our transparent pricing.</p>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Subject to fair use to protect deliverability. Gmail account limits apply to all plans. See <a href="/terms" className="text-purple-600 hover:text-purple-700 underline">Terms</a> for details.
          </div>
        </div>
      </div>
    </div>
  );
}


