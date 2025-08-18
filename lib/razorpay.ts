import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
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
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
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
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    throw error;
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
  } catch (error) {
    console.error('Error creating Razorpay customer:', error);
    throw error;
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
  } catch (error) {
    console.error('Error creating Razorpay plan:', error);
    throw error;
  }
}

// Cancel a Razorpay subscription
export async function cancelRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error cancelling Razorpay subscription:', error);
    throw error;
  }
}

// Fetch a Razorpay subscription
export async function fetchRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching Razorpay subscription:', error);
    throw error;
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