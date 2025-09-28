import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const response = NextResponse.next();

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Add caching headers for static assets
    if (pathname.match(/\.(ico|svg|jpg|jpeg|png|webp|avif|gif|css|js|woff|woff2|ttf|otf)$/)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Add cache headers for API routes
    if (pathname.startsWith('/api/')) {
      // Cache GET requests for 5 minutes
      if (req.method === 'GET') {
        response.headers.set('Cache-Control', 'private, max-age=300');
      } else {
        response.headers.set('Cache-Control', 'no-store');
      }
    }

    // If user is on onboarding page and has already completed onboarding, redirect to dashboard
    if (pathname.startsWith('/onboarding') && token?.user) {
      // We'll check this in the onboarding page itself since we can't access the database here
      return response;
    }

    // For all other protected routes, check if user needs onboarding
    if (!pathname.startsWith('/onboarding') && token?.user) {
      // We'll handle onboarding redirect in the auth callback
      return response;
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

// Protect only app areas; leave home, login, and public pages open
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/templates/:path*',
    '/uploads/:path*',
    '/campaigns/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
    '/profile/:path*'
  ]
};