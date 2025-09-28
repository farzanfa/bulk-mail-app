// Initialize Razorpay instance with dynamic import for Edge Runtime compatibility
const initRazorpay = async () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ Razorpay credentials not found in environment variables');
    console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
    throw new Error('Razorpay credentials not found. Please check your .env file.');
  }

  try {
    const { default: Razorpay } = await import('razorpay');
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (error) {
    console.error('Failed to import Razorpay:', error);
    throw new Error('Razorpay SDK not available');
  }
};

// Singleton instance
let razorpayInstance: any = null;

export const getRazorpayInstance = async () => {
  if (!razorpayInstance) {
    razorpayInstance = await initRazorpay();
  }
  return razorpayInstance;
};

// Verify payment signature using Web Crypto API
export const verifyPaymentSignature = async (
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Razorpay secret not found');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${orderId}|${paymentId}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

// Verify webhook signature using Web Crypto API
export const verifyWebhookSignature = async (
  body: string,
  signature: string
): Promise<boolean> => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Razorpay webhook secret not found');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

// Create order helper
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes?: Record<string, string>
) => {
  const razorpay = await getRazorpayInstance();
  
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error('Invalid amount for Razorpay order', { amount, currency, receipt });
    throw new Error('Invalid amount for order');
  }

  // Razorpay expects amount in smallest currency unit (paise)
  const amountInPaise = Math.round(amount * 100);

  const options = {
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    // Basic sanity check on returned order
    if (!order?.id || order.amount !== amountInPaise) {
      console.warn('Unexpected order response from Razorpay', { returnedAmount: order?.amount, expected: amountInPaise });
    }
    return order;
  } catch (error) {
    // Normalize Razorpay error to preserve useful description and statusCode
    const anyErr: any = error as any;
    const description = anyErr?.error?.description || anyErr?.message || 'Razorpay order creation failed';
    const statusCode = anyErr?.statusCode || 502;
    console.error('Error creating Razorpay order:', { description, statusCode, error: anyErr });
    const normalized = new Error(description);
    // @ts-expect-error augment for upstream handler
    normalized.statusCode = statusCode;
    throw normalized;
  }
};

// Create subscription helper
export const createRazorpaySubscription = async (
  planId: string,
  customerId: string,
  totalCount: number,
  notes?: Record<string, string>
) => {
  const razorpay = await getRazorpayInstance();
  
  const options = {
    plan_id: planId,
    customer_id: customerId,
    total_count: totalCount,
    notes,
  };

  try {
    const subscription = await razorpay.subscriptions.create(options);
    return subscription;
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    throw error;
  }
};

// Cancel subscription helper
export const cancelRazorpaySubscription = async (
  subscriptionId: string,
  cancelAtCycleEnd: boolean = true
) => {
  const razorpay = await getRazorpayInstance();
  
  try {
    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId,
      cancelAtCycleEnd
    );
    return subscription;
  } catch (error) {
    console.error('Error cancelling Razorpay subscription:', error);
    throw error;
  }
};

// Resume subscription helper
export const resumeRazorpaySubscription = async (subscriptionId: string) => {
  const razorpay = await getRazorpayInstance();
  
  try {
    const subscription = await razorpay.subscriptions.resume(
      subscriptionId,
      { resume_at: 'now' }
    );
    return subscription;
  } catch (error) {
    console.error('Error resuming Razorpay subscription:', error);
    throw error;
  }
};

// Fetch subscription details
export const fetchRazorpaySubscription = async (subscriptionId: string) => {
  const razorpay = await getRazorpayInstance();
  
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching Razorpay subscription:', error);
    throw error;
  }
};

// Plan pricing configuration
// Note: Prices are stored in the database as USD values ($29, $75, $100)
// When processing with Razorpay, these values are treated as INR amounts
// This allows displaying USD prices in UI while using INR for payment processing
// These are just the Razorpay plan IDs for subscription management
export const RAZORPAY_PLANS = {
  starter: {
    monthly: {
      id: process.env.RAZORPAY_PLAN_STARTER_MONTHLY || '',
    },
    yearly: {
      id: process.env.RAZORPAY_PLAN_STARTER_YEARLY || '',
    },
  },
  professional: {
    monthly: {
      id: process.env.RAZORPAY_PLAN_PROFESSIONAL_MONTHLY || '',
    },
    yearly: {
      id: process.env.RAZORPAY_PLAN_PROFESSIONAL_YEARLY || '',
    },
  },
  enterprise: {
    monthly: {
      id: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY || '',
    },
    yearly: {
      id: process.env.RAZORPAY_PLAN_ENTERPRISE_YEARLY || '',
    },
  },
};