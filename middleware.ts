import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { rateLimiters, getSecurityHeaders, validateRequest, auditLog } from '@/lib/security';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const response = NextResponse.next();

    // Apply security headers
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Rate limiting
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    
    // Apply different rate limits based on endpoint
    let rateLimiter = rateLimiters.api;
    if (pathname.startsWith('/api/auth/')) {
      rateLimiter = rateLimiters.auth;
    } else if (pathname.startsWith('/api/campaigns/') && req.method === 'POST') {
      rateLimiter = rateLimiters.email;
    } else if (pathname.startsWith('/api/uploads/')) {
      rateLimiter = rateLimiters.upload;
    }

    const rateLimitResult = rateLimiter.check(clientIP);
    if (!rateLimitResult.allowed) {
      auditLog.security('RATE_LIMIT_EXCEEDED', 'medium', {
        ip: clientIP,
        path: pathname,
        method: req.method
      });
      
      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          ...getSecurityHeaders()
        }
      });
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimiter.config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    // Request validation
    const validation = validateRequest.api(req);
    if (!validation.valid) {
      auditLog.security('INVALID_REQUEST', 'medium', {
        ip: clientIP,
        path: pathname,
        method: req.method,
        error: validation.error
      });
      
      return new NextResponse('Bad Request', { 
        status: 400,
        headers: getSecurityHeaders()
      });
    }

    // Add caching headers for static assets
    if (pathname.match(/\.(ico|svg|jpg|jpeg|png|webp|avif|gif|css|js|woff|woff2|ttf|otf)$/)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Add cache headers for API routes
    if (pathname.startsWith('/api/')) {
      // Cache GET requests for 5 minutes
      if (req.method === 'GET') {
        response.headers.set('Cache-Control', 'private, max-age=300, s-maxage=300');
      } else {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      }
    }

    // Performance monitoring
    const startTime = Date.now();
    response.headers.set('X-Response-Time', '0');

    // If user is on onboarding page and has already completed onboarding, redirect to dashboard
    if (pathname.startsWith('/onboarding') && token?.user) {
      return response;
    }

    // For all other protected routes, check if user needs onboarding
    if (!pathname.startsWith('/onboarding') && token?.user) {
      return response;
    }

    // Log response time
    const responseTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', responseTime.toString());

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public routes
        const publicRoutes = ['/', '/home', '/about', '/pricing', '/privacy', '/terms', '/why-us', '/support', '/refund'];
        if (publicRoutes.includes(req.nextUrl.pathname)) {
          return true;
        }
        
        // Require auth for protected routes
        return !!token;
      }
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