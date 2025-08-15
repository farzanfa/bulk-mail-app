"use client";
import { Card, Section } from '@/components/ui';
import { signIn, useSession } from 'next-auth/react';

export default function WhyUsPage() {
  const { data: session, status } = useSession();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg">
            ✨ MailWeaver
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Why teams choose <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">MailWeaver</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for fast, reliable, personalized campaigns that scale with your business
          </p>
        </div>

        {/* How it works */}
        <Section title="How it works">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
              Get started in three simple steps - no technical expertise required
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105 bg-gradient-to-br from-white to-purple-50 border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload your CSV</h3>
              <p className="text-gray-600 leading-relaxed">
                Import contacts with automatic header detection, smart de-duplication, and data cleaning.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105 bg-gradient-to-br from-white to-blue-50 border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Create a template</h3>
              <p className="text-gray-600 leading-relaxed">
                Design beautiful emails with personalized fields, preview functionality, and responsive layouts.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105 bg-gradient-to-br from-white to-green-50 border-green-200">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Launch and monitor</h3>
              <p className="text-gray-600 leading-relaxed">
                Send with built-in pacing, real-time progress tracking, and comprehensive analytics.
              </p>
            </Card>
          </div>
        </Section>

        {/* Why choose MailWeaver */}
        <Section title="Why teams choose MailWeaver">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
              Built with modern best practices and designed for real-world email marketing needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Google OAuth Integration</h3>
              <p className="text-gray-600 text-sm">
                Authenticate securely with Google and send from your own account for maximum deliverability.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Personalization at Scale</h3>
              <p className="text-gray-600 text-sm">
                Use CSV variables to personalize every email with previews that prevent costly mistakes.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart CSV Processing</h3>
              <p className="text-gray-600 text-sm">
                Intelligent data cleaning, column mapping, and validation ensure your campaigns succeed.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Safe Sending</h3>
              <p className="text-gray-600 text-sm">
                Built-in rate limiting and pacing respect provider limits for optimal deliverability.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Unsubscribe Management</h3>
              <p className="text-gray-600 text-sm">
                Secure unsubscribe links with one-click removal keep you compliant and build trust.
              </p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Modern Interface</h3>
              <p className="text-gray-600 text-sm">
                Responsive design with fast modals, intuitive cards, and seamless mobile experience.
              </p>
            </Card>
          </div>
        </Section>

        {/* Use cases */}
        <Section title="Use cases">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
              Perfect for teams that need reliable, scalable email marketing solutions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Product Launches</h3>
              <p className="text-gray-600 leading-relaxed">
                Announce new features, products, or updates to your entire customer base with personalized messaging.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Newsletters</h3>
              <p className="text-gray-600 leading-relaxed">
                Send personalized newsletters using CSV data fields without writing a single line of code.
              </p>
            </Card>
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 group hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Event Invites</h3>
              <p className="text-gray-600 leading-relaxed">
                Invite segmented contacts to events, webinars, or meetings with tracking and follow-up capabilities.
              </p>
            </Card>
          </div>
        </Section>

        {/* CTA Section */}
        <Card className="p-12 text-center bg-gradient-to-br from-purple-600 to-blue-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to streamline your email campaigns?
            </h3>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join teams who trust MailWeaver for their bulk email needs. Start sending personalized campaigns in minutes.
            </p>
            {status === 'loading' ? (
              <div className="inline-flex px-8 py-4 rounded-lg bg-white/20">
                <div className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : session?.user ? (
              <a 
                href="/dashboard" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-purple-600 font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
              >
                Go to Dashboard →
              </a>
            ) : (
              <button 
                className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-white text-gray-900 font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                  </g>
                </svg>
                Get started with Google
              </button>
            )}
            <div className="mt-6">
              <a href="/pricing" className="text-white/80 hover:text-white underline underline-offset-4 transition-colors">
                See pricing plans →
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


