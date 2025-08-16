import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function NotFound() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean((session as any)?.user);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Animated 404 Number */}
        <div className="relative">
          <div className="text-9xl font-black text-gray-200 select-none animate-pulse">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold text-gray-800 animate-bounce">
              404
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Oops! Page Not Found
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Looks like this page got <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">lost in the mail</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The page you're looking for doesn't exist or may have been moved. 
              Don't worry, we'll help you get back on track!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a 
              href="/" 
              className="group inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-purple-400 hover:text-purple-700 transition-all duration-200 shadow-sm hover:shadow"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </a>
            
            {isAuthed ? (
              <a 
                href="/dashboard" 
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Go to Dashboard
              </a>
            ) : (
              <a 
                href="/campaigns" 
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Explore Campaigns
              </a>
            )}
          </div>

          {/* Additional Helpful Links */}
          <div className="pt-8">
            <p className="text-sm text-gray-500 mb-4">Or try these helpful pages:</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="/templates" className="text-sm text-gray-600 hover:text-purple-600 transition-colors px-3 py-1 rounded-md hover:bg-purple-50">
                Templates
              </a>
              <a href="/uploads" className="text-sm text-gray-600 hover:text-purple-600 transition-colors px-3 py-1 rounded-md hover:bg-purple-50">
                Uploads
              </a>
              <a href="/why-us" className="text-sm text-gray-600 hover:text-purple-600 transition-colors px-3 py-1 rounded-md hover:bg-purple-50">
                Why MailWeaver
              </a>
              <a href="/pricing" className="text-sm text-gray-600 hover:text-purple-600 transition-colors px-3 py-1 rounded-md hover:bg-purple-50">
                Pricing
              </a>
            </div>
          </div>

          {/* Fun Illustration */}
          <div className="pt-8 opacity-60">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Even the best emails sometimes get lost in transit!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


