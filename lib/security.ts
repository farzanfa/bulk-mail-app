import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100,
      message: 'Too many requests, please try again later.',
      ...config
    };
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Clean up expired entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    const current = rateLimitStore.get(identifier) || { count: 0, resetTime: now + this.config.windowMs };
    
    if (current.resetTime < now) {
      current.count = 0;
      current.resetTime = now + this.config.windowMs;
    }

    current.count++;
    rateLimitStore.set(identifier, current);

    return {
      allowed: current.count <= this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - current.count),
      resetTime: current.resetTime
    };
  }
}

// Predefined rate limiters
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000
  }),
  
  // Authentication rate limiting
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  }),
  
  // Email sending rate limiting
  email: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 emails per minute
  }),
  
  // Upload rate limiting
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
  })
};

// Input sanitization
export const sanitizeInput = {
  // Sanitize string input
  string(input: string): string {
    if (typeof input !== 'string') return '';
    return input.trim().slice(0, 1000); // Limit length
  },

  // Sanitize email
  email(input: string): string {
    if (typeof input !== 'string') return '';
    const email = input.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? email : '';
  },

  // Sanitize HTML content
  html(input: string): string {
    if (typeof input !== 'string') return '';
    // Remove potentially dangerous tags and attributes
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  },

  // Sanitize file name
  filename(input: string): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 255);
  }
};

// CSRF protection
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  if (!token || !sessionToken) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
};

// Content Security Policy
export const getCSP = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.razorpay.com https://www.googleapis.com https://accounts.google.com",
    "frame-src 'self' https://accounts.google.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  if (isDevelopment) {
    directives.push("script-src 'unsafe-eval'"); // For development hot reload
  }

  return directives.join('; ');
};

// Security headers
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': getCSP(),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };
};

// Request validation
export const validateRequest = {
  // Validate API request
  api(req: NextRequest): { valid: boolean; error?: string } {
    const contentType = req.headers.get('content-type');
    const userAgent = req.headers.get('user-agent');
    
    // Check for suspicious user agents
    if (userAgent && (
      userAgent.includes('bot') || 
      userAgent.includes('crawler') || 
      userAgent.includes('spider') ||
      userAgent.length < 10
    )) {
      return { valid: false, error: 'Invalid user agent' };
    }

    // Validate content type for POST requests
    if (req.method === 'POST' && contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return { valid: false, error: 'Invalid content type' };
    }

    return { valid: true };
  },

  // Validate file upload
  fileUpload(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    return { valid: true };
  }
};

// Encryption utilities
export const encryption = {
  // Encrypt sensitive data
  encrypt(text: string, key: string = process.env.ENCRYPTION_KEY!): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  },

  // Decrypt sensitive data
  decrypt(encryptedData: string, key: string = process.env.ENCRYPTION_KEY!): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
};

// Audit logging
export const auditLog = {
  log(event: string, userId?: string, metadata?: Record<string, any>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      metadata,
      ip: 'unknown', // Would be set by middleware
      userAgent: 'unknown'
    };

    // In production, this would be sent to a logging service
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Audit Log:', logEntry);
    }
  },

  // Log security events
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>) {
    auditLog.log(`SECURITY_${event}`, undefined, { severity, ...metadata });
  }
};
