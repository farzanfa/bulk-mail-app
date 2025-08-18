import crypto from 'crypto';

/**
 * Security utilities for Razorpay integration
 */

// Validate Razorpay webhook IP addresses (if needed)
const RAZORPAY_WEBHOOK_IPS: string[] = [
  // Add Razorpay's webhook IP addresses here if they provide a whitelist
];

/**
 * Verify webhook request origin
 */
export function isValidWebhookSource(ip: string): boolean {
  // If no IP whitelist is provided, allow all
  if (RAZORPAY_WEBHOOK_IPS.length === 0) {
    return true;
  }
  return RAZORPAY_WEBHOOK_IPS.includes(ip);
}

/**
 * Sanitize and validate order receipt
 */
export function sanitizeReceipt(receipt: string): string {
  // Remove any special characters that could be used for injection
  return receipt.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Validate amount to prevent negative or invalid values
 */
export function validateAmount(amount: number): boolean {
  return amount > 0 && amount <= 10000000; // Max 1 lakh rupees
}

/**
 * Generate secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Rate limiting for payment attempts
 */
const paymentAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, maxAttempts = 5, windowMs = 900000): boolean {
  const now = Date.now();
  const userAttempts = paymentAttempts.get(userId);

  if (!userAttempts || userAttempts.resetAt < now) {
    paymentAttempts.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userAttempts.count >= maxAttempts) {
    return false;
  }

  userAttempts.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [userId, attempts] of paymentAttempts.entries()) {
    if (attempts.resetAt < now) {
      paymentAttempts.delete(userId);
    }
  }
}

// Run cleanup every 15 minutes
setInterval(cleanupRateLimits, 15 * 60 * 1000);

/**
 * Validate Razorpay response data
 */
export function validateRazorpayResponse(data: any): boolean {
  // Check for required fields
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Add more validation based on your requirements
  return true;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const masked = { ...data };
  const sensitiveFields = ['card', 'account', 'cvv', 'password', 'key_secret'];

  for (const field of sensitiveFields) {
    if (masked[field]) {
      if (typeof masked[field] === 'string') {
        masked[field] = masked[field].substring(0, 4) + '****';
      } else if (typeof masked[field] === 'object') {
        masked[field] = maskSensitiveData(masked[field]);
      }
    }
  }

  return masked;
}