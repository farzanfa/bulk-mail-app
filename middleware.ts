export { default } from 'next-auth/middleware';

// Protect all routes by default, except explicitly public ones
export const config = {
  matcher: [
    // Exclude NextAuth, cron jobs, unsubscribe links, login, OAuth callback, and static assets
    '/((?!api/auth|api/unsubscribe|api/jobs/cron|api/jobs/send|api/google/oauth/callback|login|u/|icon\\.svg|manifest\\.webmanifest|favicon\\.ico|_next|public).*)'
  ]
};


