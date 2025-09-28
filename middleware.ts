// Simplified middleware for Edge Runtime compatibility
import { NextResponse } from 'next/server';
import { rateLimiters, getSecurityHeaders, auditLog } from '@/lib/security';

export function middleware(req: any) {
  const pathname = req.nextUrl.pathname;
  const response = NextResponse.next();

  // Apply security headers
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Get client IP
  const clientIP = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Rate limiting
  const rateLimiter = rateLimiters.api;
  const rateLimitResult = rateLimiter.check(clientIP);
  
  if (!rateLimitResult.allowed) {
    auditLog.security('RATE_LIMIT_EXCEEDED', 'medium', {
      ip: clientIP,
      path: pathname,
      method: req.method,
      limit: rateLimiter.config.maxRequests,
      window: rateLimiter.config.windowMs
    });
    
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        ...getSecurityHeaders(),
        'Retry-After': Math.ceil(rateLimiter.config.windowMs / 1000).toString(),
        'X-RateLimit-Limit': rateLimiter.config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    });
  }

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimiter.config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  // Basic request validation
  const userAgent = req.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    auditLog.security('INVALID_REQUEST', 'medium', {
      ip: clientIP,
      path: pathname,
      method: req.method,
      error: 'Invalid user agent'
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

  // Add security headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }

  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  return response;
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};