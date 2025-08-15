import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // If user is on onboarding page and has already completed onboarding, redirect to dashboard
    if (pathname.startsWith('/onboarding') && token?.user) {
      // We'll check this in the onboarding page itself since we can't access the database here
      return NextResponse.next();
    }

    // For all other protected routes, check if user needs onboarding
    if (!pathname.startsWith('/onboarding') && token?.user) {
      // We'll handle onboarding redirect in the auth callback
      return NextResponse.next();
    }

    return NextResponse.next();
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
    '/onboarding/:path*'
  ]
};