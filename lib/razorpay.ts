import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const initRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ Razorpay credentials not found in environment variables');
    console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
    throw new Error('Razorpay credentials not found. Please check your .env file.');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Singleton instance
let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    razorpayInstance = initRazorpay();
  }
  return razorpayInstance;
};

// Verify payment signature
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Razorpay secret not found');
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

// Verify webhook signature
export const verifyWebhookSignature = (
  body: string,
  signature: string
): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Razorpay webhook secret not found');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

// Create order helper
export const createRazorpayOrder = async (
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes?: Record<string, string>
) => {
  const razorpay = getRazorpayInstance();
  
  const options = {
    amount: amount * 100, // Razorpay expects amount in smallest currency unit (cents for USD, paise for INR)
    currency,
    receipt,
    notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

// Create subscription helper
export const createRazorpaySubscription = async (
  planId: string,
  customerId: string,
  totalCount: number,
  notes?: Record<string, string>
) => {
  const razorpay = getRazorpayInstance();
  
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
  const razorpay = getRazorpayInstance();
  
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
  const razorpay = getRazorpayInstance();
  
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
  const razorpay = getRazorpayInstance();
  
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