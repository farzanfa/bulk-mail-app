import { Card } from '@/components/ui';

export const dynamic = 'force-static';
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg">
            🔒 Privacy
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Privacy <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This policy explains what information MailWeaver collects, how we use it, and your choices. 
            We designed MailWeaver to access only the minimum data necessary to send campaigns you initiate.
          </p>
        </div>

        {/* Data Collection */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Data We Collect</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Account Information</h4>
                <p className="text-blue-700 text-sm">Your Google email and basic profile when you sign in.</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Google Tokens</h4>
                <p className="text-green-700 text-sm">Refresh/access tokens required to send email on your behalf (stored encrypted at rest).</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">Campaign Content</h4>
                <p className="text-purple-700 text-sm">Templates and campaign content that you create.</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 mb-2">Recipient Data</h4>
                <p className="text-orange-700 text-sm">CSV data you upload (e.g., <code className="bg-white px-1 py-0.5 rounded text-xs">email</code>, <code className="bg-white px-1 py-0.5 rounded text-xs">first_name</code>).</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Google Access */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Google Access</h2>
          </div>
          <p className="text-gray-700 mb-6">
            We use Google OAuth solely to allow you to send email using your own account. We request the following scopes:
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Required Scopes</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">https://www.googleapis.com/auth/gmail.send</code>
                  <span className="text-gray-600 text-sm">(send email)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">openid</code>
                  <span className="text-gray-600 text-sm">(sign-in)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">email</code>
                  <span className="text-gray-600 text-sm">(sign-in)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">profile</code>
                  <span className="text-gray-600 text-sm">(sign-in)</span>
                </div>
              </div>
            </div>
            <p className="text-gray-700">
              Use of Google user data adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline">Google API Services User Data Policy</a>, including the <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline">Limited Use</a> requirements.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">No Reading</h4>
                <p className="text-green-700 text-sm">No reading of message content from your mailbox; we only send messages you create.</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">No Selling</h4>
                <p className="text-blue-700 text-sm">No selling or transferring Google user data to third parties, and no use for advertising.</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">Limited Access</h4>
                <p className="text-purple-700 text-sm">No human access to Google user data except as required for security, compliance, or to service a specific request.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* How We Use Data */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">How We Use Data</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">To authenticate your account and operate MailWeaver features.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">To render templates with your uploaded variables and send your campaigns.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">To provide delivery status, logs, and basic analytics.</p>
            </div>
          </div>
        </Card>

        {/* Retention and Deletion */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Retention and Deletion</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">You can disconnect Google at any time in Google Account settings; we will no longer be able to send on your behalf.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">You may delete templates, uploads, contacts, and campaigns from within the app; associated data is removed from our primary systems.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">Backups and logs are retained for a limited period for reliability and security, after which they are purged.</p>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">Google refresh tokens are encrypted using industry-standard encryption at rest.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">Transport security (HTTPS) is enforced for all network communication.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">Access is least-privilege and audited.</p>
            </div>
          </div>
        </Card>

        {/* Data Sharing */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Data Sharing</h2>
          </div>
          <p className="text-gray-700 mb-6">
            We do not sell your data. Limited sharing occurs with infrastructure providers strictly to operate the service:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Cloud Hosting</h4>
              <p className="text-gray-700 text-sm">Secure cloud infrastructure for hosting and building the service.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Database</h4>
              <p className="text-gray-700 text-sm">Managed PostgreSQL database for storing your data securely.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Storage</h4>
              <p className="text-gray-700 text-sm">Managed object storage for CSV files and attachments.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Key-Value Store</h4>
              <p className="text-gray-700 text-sm">Managed key-value store for caching and rate limiting.</p>
            </div>
          </div>
          <p className="text-gray-700 mt-6">
            Our subprocessors are bound by security and privacy commitments appropriate to their services.
          </p>
        </Card>

        {/* Your Choices */}
        <Card className="p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your Choices</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">Revoke Google access at any time from your Google Account permissions.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">Delete uploads, contacts, campaigns, and templates in the app.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">Contact us to request account deletion.</p>
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



