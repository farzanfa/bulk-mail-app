export { default } from 'next-auth/middleware';

// Protect only app areas; leave home, login, and public pages open
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/templates/:path*',
    '/uploads/:path*',
    '/campaigns/:path*',
    '/admin/:path*',
  ]
};


