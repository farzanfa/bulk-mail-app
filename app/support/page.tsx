import { Card } from '@/components/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Support',
  description: 'Get help with MailWeaver. Find answers to common questions, contact our support team, and access helpful resources.',
  openGraph: {
    title: 'Customer Support - MailWeaver',
    description: 'We are here to help. Get support for your email campaigns and account questions.',
  },
};

export const dynamic = 'force-dynamic';
export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg">
            💬 Support
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Customer <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Support</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help you succeed with your email campaigns. Find answers, get assistance, and connect with our support team.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Email Support */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Email Support</h3>
            <p className="text-gray-600 mb-4">Get help via email within 24 hours</p>
            <a href="mailto:support@mailweaver.com" className="text-purple-600 hover:text-purple-700 font-medium">
              support@mailweaver.com
            </a>
          </Card>

          {/* Documentation */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Documentation</h3>
            <p className="text-gray-600 mb-4">Browse our comprehensive guides</p>
            <a href="/docs" className="text-purple-600 hover:text-purple-700 font-medium">
              View Documentation
            </a>
          </Card>

          {/* Community */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Community</h3>
            <p className="text-gray-600 mb-4">Connect with other users</p>
            <a href="https://community.mailweaver.com" className="text-purple-600 hover:text-purple-700 font-medium">
              Join Community
            </a>
          </Card>
        </div>

        {/* Frequently Asked Questions */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Quick answers to common questions about MailWeaver</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Getting Started */}
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I get started with MailWeaver?</h3>
              <p className="text-gray-600">
                Getting started is easy! Simply sign in with your Google account, create your first email template, 
                upload your contact list, and you're ready to send your first campaign. Our intuitive interface 
                guides you through each step.
              </p>
            </Card>

            {/* Email Limits */}
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What are the email sending limits?</h3>
              <p className="text-gray-600">
                Email sending limits depend on your subscription plan and your email provider's limits. 
                Free plans allow up to 500 emails per month, while premium plans offer higher limits. 
                We also respect Gmail's daily sending limits to ensure deliverability.
              </p>
            </Card>

            {/* Template Variables */}
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How do template variables work?</h3>
              <p className="text-gray-600">
                Template variables allow you to personalize emails. Use {`{{firstName}}`}, {`{{company}}`}, 
                or any custom variable in your template. When sending, these are automatically replaced 
                with data from your contact list.
              </p>
            </Card>

            {/* Deliverability */}
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How do you ensure email deliverability?</h3>
              <p className="text-gray-600">
                MailWeaver sends emails directly from your Gmail account, ensuring maximum deliverability. 
                We also provide best practices for avoiding spam filters, including proper formatting, 
                authentication, and sending rate management.
              </p>
            </Card>

            {/* Pricing */}
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Is MailWeaver free to use?</h3>
              <p className="text-gray-600">
                Yes! MailWeaver offers a free plan with basic features and up to 500 emails per month. 
                For higher volumes and advanced features like analytics and automation, check out our 
                premium plans on the pricing page.
              </p>
            </Card>

            {/* Data Security */}
            <Card className="p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How secure is my data?</h3>
              <p className="text-gray-600">
                We take security seriously. All data is encrypted in transit and at rest. We use OAuth 
                for Gmail authentication, so we never store your password. Your contact data is isolated 
                and only accessible by you.
              </p>
            </Card>
          </div>
        </div>

        {/* Additional Resources */}
        <Card className="p-8 bg-gradient-to-r from-purple-50 to-blue-50 border-0">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Need More Help?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is ready to assist you with any questions 
              about your email campaigns, account settings, or technical issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@mailweaver.com" 
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
              <a 
                href="/docs" 
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:border-gray-400 transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Documentation
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}