import Razorpay from 'razorpay';
import crypto from 'crypto';
import { handleRazorpayError } from './razorpay-errors';

// Lazy initialization of Razorpay instance
let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    // Validate environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        'Missing Razorpay configuration. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in your environment variables.'
      );
    }

    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  
  return razorpayInstance;
}

// Export for backward compatibility
export const razorpay = new Proxy({} as Razorpay, {
  get(target, prop) {
    const instance = getRazorpayInstance();
    return (instance as any)[prop];
  }
});

// Verify Razorpay payment signature
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest('hex');
  
  return expectedSignature === signature;
}

// Create a Razorpay order
export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt,
  notes = {},
}: {
  amount: number; // Amount in paise (100 paise = 1 INR)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes,
    });
    return order;
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    throw handleRazorpayError(error);
  }
}

// Create a Razorpay subscription
export async function createRazorpaySubscription({
  planId,
  customerId,
  totalCount,
  notes = {},
}: {
  planId: string;
  customerId?: string;
  totalCount: number;
  notes?: Record<string, string>;
}) {
  try {
    const subscriptionData: any = {
      plan_id: planId,
      total_count: totalCount,
      notes,
    };
    
    // Add customer_id only if provided
    if (customerId) {
      subscriptionData.customer_id = customerId;
    }
    
    const subscription = await razorpay.subscriptions.create(subscriptionData);
    return subscription;
  } catch (error: any) {
    console.error('Error creating Razorpay subscription:', error);
    throw handleRazorpayError(error);
  }
}

// Create a Razorpay customer
export async function createRazorpayCustomer({
  name,
  email,
  contact,
  notes = {},
}: {
  name: string;
  email: string;
  contact?: string;
  notes?: Record<string, string>;
}) {
  try {
    const customer = await razorpay.customers.create({
      name,
      email,
      contact,
      notes,
    });
    return customer;
  } catch (error: any) {
    console.error('Error creating Razorpay customer:', error);
    throw handleRazorpayError(error);
  }
}

// Create Razorpay plans
export async function createRazorpayPlan({
  planId,
  name,
  amount,
  currency = 'INR',
  period = 'monthly',
  interval = 1,
  description,
  notes = {},
}: {
  planId: string;
  name: string;
  amount: number; // Amount in paise
  currency?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  description?: string;
  notes?: Record<string, string>;
}) {
  try {
    const plan = await razorpay.plans.create({
      period,
      interval,
      item: {
        id: planId,
        name,
        amount,
        currency,
        description,
      },
      notes,
    });
    return plan;
  } catch (error: any) {
    console.error('Error creating Razorpay plan:', error);
    throw handleRazorpayError(error);
  }
}

// Cancel a Razorpay subscription
export async function cancelRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error: any) {
    console.error('Error cancelling Razorpay subscription:', error);
    throw handleRazorpayError(error);
  }
}

// Fetch a Razorpay subscription
export async function fetchRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error: any) {
    console.error('Error fetching Razorpay subscription:', error);
    throw handleRazorpayError(error);
  }
}

// Helper function to convert amount to paise
export function amountToPaise(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to convert paise to amount
export function paiseToAmount(paise: number): number {
  return paise / 100;
}