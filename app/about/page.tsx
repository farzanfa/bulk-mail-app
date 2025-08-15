import { Card } from '@/components/ui';

export const dynamic = 'force-static';
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg">
            ℹ️ About
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            About <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">MailWeaver</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A modern bulk email platform designed to help you create, upload, and send campaigns reliably at scale.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* What you can do */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">What you can do</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Sign in with your Google account and send campaigns from your own account for maximum deliverability.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Create reusable templates with variables for personalized emails that engage your audience.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Upload CSV files and manage recipients grouped by each upload with smart data processing.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Run campaigns in the background with automatic pacing, retries, and real-time progress tracking.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Track delivery outcomes and campaign performance with comprehensive analytics.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Provide one-click unsubscribe links for compliance and user control.</p>
              </div>
            </div>
          </Card>

          {/* Privacy & Safety */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Privacy & Safety</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                We only store the minimum data required to operate the service and deliver your emails. Your privacy and security are our top priorities.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-green-800">Limited Google Access</h4>
                    <p className="text-green-700 text-sm mt-1">Access to your Google account is limited to sending email you explicitly authorize.</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-blue-800">Full Control</h4>
                    <p className="text-blue-700 text-sm mt-1">You can revoke access at any time from your Google account settings.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* About the Developer */}
        <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50 border-purple-200">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Developer</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              MailWeaver is built and maintained by <strong>Farzan Arshad</strong>, a passionate developer focused on creating 
              reliable, user-friendly tools that solve real-world problems.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://www.farzanfa.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Visit Website
              </a>
              <a 
                href="https://github.com/farzanfa" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Profile
              </a>
            </div>
          </div>
        </Card>

        {/* Last Updated */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}



