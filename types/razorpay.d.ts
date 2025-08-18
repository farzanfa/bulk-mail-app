declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface OrderCreateOptions {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, any>;
  }

  interface SubscriptionCreateOptions {
    plan_id: string;
    total_count: number;
    customer_id?: string;
    notes?: Record<string, any>;
    notify_info?: {
      notify_phone?: string;
      notify_email?: string;
    };
  }

  interface CustomerCreateOptions {
    name: string;
    email: string;
    contact?: string;
    notes?: Record<string, any>;
  }

  interface PlanCreateOptions {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    item: {
      id: string;
      name: string;
      amount: number;
      currency: string;
      description?: string;
    };
    notes?: Record<string, any>;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    
    orders: {
      create(options: OrderCreateOptions): Promise<any>;
      fetch(orderId: string): Promise<any>;
    };
    
    subscriptions: {
      create(options: SubscriptionCreateOptions): Promise<any>;
      fetch(subscriptionId: string): Promise<any>;
      cancel(subscriptionId: string): Promise<any>;
    };
    
    customers: {
      create(options: CustomerCreateOptions): Promise<any>;
      fetch(customerId: string): Promise<any>;
    };
    
    plans: {
      create(options: PlanCreateOptions): Promise<any>;
      fetch(planId: string): Promise<any>;
    };
  }

  export = Razorpay;
}