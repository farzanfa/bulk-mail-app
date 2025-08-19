'use client';

import { useState, useEffect } from 'react';

interface UpgradeSectionProps {
  userEmail: string;
}

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

export default function UpgradeSection({ userEmail }: UpgradeSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanType, setCurrentPlanType] = useState<string>('free');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingPlanType, setUpgradingPlanType] = useState<string | null>(null);

  useEffect(() => {
    fetchPlansAndSubscription();
  }, [userEmail]);

  const fetchPlansAndSubscription = async () => {
    try {
      const [plansResponse, subResponse] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/subscription'),
      ]);

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData);
      }

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setCurrentPlanType(subData.plan.type);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  const getPrice = (plan: Plan) => {
    return billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
  };

  const getSavings = (plan: Plan) => {
    const monthlyCost = plan.price_monthly * 12;
    const yearlyCost = plan.price_yearly;
    return monthlyCost - yearlyCost;
  };

  const handleUpgrade = async (planType: string) => {
    try {
      setUpgradingPlanType(planType);
      
      // Find the plan by type
      const selectedPlan = plans.find(p => p.type === planType);
      if (!selectedPlan) {
        console.error('Plan not found');
        alert('Selected plan not found. Please refresh the page and try again.');
        setUpgradingPlanType(null);
        return;
      }

      // TODO: Implement Stripe payment integration
      alert('Payment integration is being set up. Please check back soon.');
      setUpgradingPlanType(null);
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
      setUpgradingPlanType(null);
    }
  };



  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sortedPlans = plans.sort((a, b) => a.price_monthly - b.price_monthly);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upgrade Your Plan</h2>
        <p className="text-gray-600 mb-6">Choose the perfect plan for your email campaign needs</p>
        
        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center mb-8">
          <span className={`mr-3 ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`ml-3 ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly
            <span className="ml-1 text-sm text-green-600">(Save up to 20%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedPlans.map((plan) => {
          const isCurrentPlan = plan.type === currentPlanType;
          const isProfessional = plan.type === 'professional';
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 ${
                isProfessional
                  ? 'border-blue-500 shadow-lg'
                  : isCurrentPlan
                  ? 'border-gray-400'
                  : 'border-gray-200'
              } p-6 ${isProfessional ? 'scale-105' : ''}`}
            >
              {isProfessional && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    ${getPrice(plan)}
                  </span>
                  <span className="ml-1 text-gray-500">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {billingPeriod === 'yearly' && getSavings(plan) > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Save ${getSavings(plan)} annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    <strong>{formatLimit(plan.emails_per_month)}</strong> emails/month
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    <strong>{formatLimit(plan.contacts_limit)}</strong> contacts
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    <strong>{formatLimit(plan.templates_limit)}</strong> templates
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    <strong>{formatLimit(plan.campaigns_limit)}</strong> campaigns
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    <strong>{formatLimit(plan.team_members)}</strong> team members
                  </span>
                </li>
                
                {plan.custom_branding && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">Custom branding</span>
                  </li>
                )}
                
                {plan.priority_support && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">Priority support</span>
                  </li>
                )}
                
                {plan.api_access && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">API access</span>
                  </li>
                )}
                
                {plan.advanced_analytics && (
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">Advanced analytics</span>
                  </li>
                )}
              </ul>

              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full py-2 px-4 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.type)}
                  disabled={upgradingPlanType !== null}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    upgradingPlanType === plan.type
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : isProfessional
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } ${upgradingPlanType !== null && upgradingPlanType !== plan.type ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {upgradingPlanType === plan.type ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    plan.price_monthly === 0 ? 'Downgrade' : 'Upgrade'
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">
          Need a custom plan for your enterprise? 
        </p>
        <a
          href="mailto:sales@example.com"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Contact our sales team →
        </a>
      </div>
    </div>
  );
}