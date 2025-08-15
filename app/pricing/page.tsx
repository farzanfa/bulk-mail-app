"use client";
import { Card } from '@/components/ui';
import { signIn, useSession } from 'next-auth/react';

export default function PricingPage() {
  const { data: session, status } = useSession();
  
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
            Start free, scale as you grow. Cancel anytime with no hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 relative overflow-hidden hover:shadow-xl transition-all duration-300 group hover:scale-105">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
                <div className="text-gray-600">per month</div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">2 email templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">2 CSV uploads</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">50 contacts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">100 emails per month</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Basic analytics</span>
                </div>
              </div>
              
              {status === 'loading' ? (
                <div className="w-full px-6 py-3 rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
              ) : session?.user ? (
                <a 
                  href="/dashboard" 
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-center block hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard
                </a>
              ) : (
                <button 
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                >
                  Get started for free
                </button>
              )}
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 relative overflow-hidden hover:shadow-xl transition-all duration-300 group hover:scale-105 border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-full">
                Coming Soon
              </span>
            </div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">$29</div>
                <div className="text-gray-600">per month</div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Unlimited templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Unlimited uploads</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Unlimited contacts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Unlimited emails</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Priority support</span>
                </div>
              </div>
              
              <a 
                href="mailto:hello@farzanfa.com?subject=Pro%20Plan%20Waitlist" 
                className="w-full px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold text-center block hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Join waitlist
              </a>
            </div>
          </Card>

          {/* Beta Plan */}
          <Card className="p-8 relative overflow-hidden hover:shadow-xl transition-all duration-300 group hover:scale-105 border-2 border-yellow-200 bg-gradient-to-br from-white to-yellow-50">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium rounded-full">
                Beta
              </span>
            </div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Beta</h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
                <div className="text-gray-600">limited time</div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">All Pro features</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Early access to new features</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Direct feedback channel</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Help shape the product</span>
                </div>
              </div>
              
              <a 
                href="mailto:hello@farzanfa.com?subject=Beta%20Access%20Request" 
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-center block hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Request access
              </a>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-6">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Frequently asked questions</h3>
            <div className="space-y-4 text-left">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Can I change plans later?</h4>
                <p className="text-gray-600 text-sm">Yes! You can upgrade to Pro or request Beta access at any time. Your data and settings will be preserved.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">What happens if I exceed my limits?</h4>
                <p className="text-gray-600 text-sm">We'll notify you when you're approaching limits. You can upgrade to Pro or wait until the next billing cycle.</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Is there a setup fee?</h4>
                <p className="text-gray-600 text-sm">No setup fees, no hidden costs. You only pay for what you use with our transparent pricing.</p>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Subject to fair use to protect deliverability. See <a href="/terms" className="text-purple-600 hover:text-purple-700 underline">Terms</a> for details.
          </div>
        </div>
      </div>
    </div>
  );
}


