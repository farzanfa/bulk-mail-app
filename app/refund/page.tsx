import { Card } from '@/components/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'MailWeaver Cancellation & Refund Policy. Learn about our subscription cancellation process and refund eligibility.',
  openGraph: {
    title: 'Cancellation & Refund Policy - MailWeaver',
    description: 'Understand our fair and transparent cancellation and refund policies for MailWeaver subscriptions.',
  },
};

export const dynamic = 'force-dynamic';
export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg">
            💳 Policy
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Cancellation & <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Refund Policy</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We believe in fair and transparent policies. Here's everything you need to know about cancellations and refunds.
          </p>
        </div>

        {/* Subscription Cancellation */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Subscription Cancellation</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Cancel Anytime</p>
                <p className="text-gray-600">You can cancel your subscription at any time through your account dashboard. No questions asked.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Immediate Effect</p>
                <p className="text-gray-600">Cancellations take effect immediately, but you'll retain access until the end of your current billing period.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">No Cancellation Fees</p>
                <p className="text-gray-600">We never charge cancellation fees. You're free to leave whenever you want.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Data Retention</p>
                <p className="text-gray-600">Your data remains available for 30 days after cancellation, allowing you to export or reactivate if needed.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Refund Eligibility */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Refund Eligibility</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">7-Day Money-Back Guarantee</p>
                <p className="text-gray-600">New subscribers are eligible for a full refund within 7 days of their first payment if they're not satisfied with the service.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Unused Service</p>
                <p className="text-gray-600">If you haven't sent any campaigns during the refund period, you're automatically eligible for a full refund.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Technical Issues</p>
                <p className="text-gray-600">If service disruptions or technical issues prevent you from using MailWeaver, we'll provide appropriate compensation or refunds.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Pro-rata Refunds</p>
                <p className="text-gray-600">Annual plan cancellations within the first 30 days are eligible for pro-rata refunds minus any usage.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Refund Process */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Refund Process</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <p className="text-gray-700 font-medium mb-1">Submit Request</p>
                  <p className="text-gray-600">Contact our support team at support@mailweaver.com with your refund request and reason.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <p className="text-gray-700 font-medium mb-1">Review Process</p>
                  <p className="text-gray-600">We'll review your request within 24-48 hours and may ask for additional information if needed.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <p className="text-gray-700 font-medium mb-1">Approval & Processing</p>
                  <p className="text-gray-600">Once approved, refunds are processed within 5-7 business days to your original payment method.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <p className="text-gray-700 font-medium mb-1">Confirmation</p>
                  <p className="text-gray-600">You'll receive an email confirmation once the refund has been processed.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Non-Refundable Items */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Non-Refundable Items</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Used Email Credits</p>
                <p className="text-gray-600">Email credits that have already been used to send campaigns are non-refundable.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Past Billing Periods</p>
                <p className="text-gray-600">Refunds are not available for previous billing periods that have already been fully utilized.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Add-on Services</p>
                <p className="text-gray-600">One-time purchases or add-on services are generally non-refundable unless defective.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Terms Violations</p>
                <p className="text-gray-600">Accounts terminated due to violations of our Terms of Service are not eligible for refunds.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Important Notes */}
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-blue-50 border-0">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Important Notes</h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">
                  <span className="font-semibold">Free Plan:</span> The free plan doesn't require payment and therefore isn't subject to refund policies.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">
                  <span className="font-semibold">Disputes:</span> If you disagree with a refund decision, you can appeal by providing additional information to our support team.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">
                  <span className="font-semibold">Policy Updates:</span> This policy may be updated periodically. Significant changes will be communicated via email.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Section */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Have Questions?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            If you have any questions about our cancellation and refund policy, or need assistance with a refund request, 
            our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@mailweaver.com?subject=Refund%20Request" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Request Refund
            </a>
            <a 
              href="/support" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:border-gray-400 transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}