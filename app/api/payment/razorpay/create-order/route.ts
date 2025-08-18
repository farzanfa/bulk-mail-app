import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createRazorpayOrder, amountToPaise } from '@/lib/razorpay';
import { checkRateLimit, sanitizeReceipt, validateAmount } from '@/lib/razorpay-security';
import { z } from 'zod';
import { SubscriptionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  planId: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
});

export async function POST(request: NextRequest) {
  console.log('Razorpay create-order endpoint called');
  console.log('Environment check:', {
    hasKeyId: !!process.env.RAZORPAY_KEY_ID,
    hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
    keyIdPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 8) + '...',
  });
  
  try {
    // Check if Razorpay is properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay environment variables not configured');
      return NextResponse.json(
        { error: 'Payment service not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    console.log('Session check:', { hasSession: !!session, hasUser: !!session?.user });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as any).user.id;
    console.log('User ID:', userId);
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { planId, billingCycle } = validation.data;

    // Get the plan details
    console.log('Fetching plan:', planId);
    let plan;
    try {
      plan = await prisma.plans.findUnique({
        where: { id: planId },
      });
      console.log('Plan found:', { planId, found: !!plan, planName: plan?.name });
    } catch (dbError: any) {
      console.error('Database error while fetching plan:', {
        error: dbError,
        message: dbError?.message,
        code: dbError?.code,
      });
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if plan is free
    if (plan.type === 'free') {
      return NextResponse.json({ error: 'Cannot create order for free plan' }, { status: 400 });
    }

    // Get user details
    console.log('Fetching user:', userId);
    let user;
    try {
      user = await prisma.users.findUnique({
        where: { id: userId },
      });
      console.log('User found:', { userId, found: !!user, email: user?.email });
    } catch (dbError: any) {
      console.error('Database error while fetching user:', {
        error: dbError,
        message: dbError?.message,
        code: dbError?.code,
      });
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate amount based on billing cycle
    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    
    // Validate amount
    if (!validateAmount(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    
    const amountInPaise = amountToPaise(amount);

    // Check if user has an existing subscription
    const existingSubscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
    });

    // Create Razorpay order
    const receipt = sanitizeReceipt(`sub_${userId}_${Date.now()}`);
    console.log('Creating Razorpay order:', {
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      planName: plan.name,
      billingCycle,
    });
    
    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId,
        planId,
        billingCycle,
        planName: plan.name,
      },
    });
    
    console.log('Razorpay order created:', { orderId: razorpayOrder.id, status: razorpayOrder.status });

    // Create or update subscription record
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: SubscriptionStatus.active, // Will be verified after payment
      payment_gateway: 'razorpay',
      updated_at: new Date(),
    };

    let subscription;
    if (existingSubscription) {
      subscription = await prisma.user_subscriptions.update({
        where: { id: existingSubscription.id },
        data: subscriptionData,
      });
    } else {
      subscription = await prisma.user_subscriptions.create({
        data: {
          ...subscriptionData,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Create payment record
    await prisma.payments.create({
      data: {
        subscription_id: subscription.id,
        razorpay_order_id: razorpayOrder.id,
        amount,
        currency: 'INR',
        status: 'pending' as const,
        payment_gateway: 'razorpay',
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name: 'MailApp',
      description: `${plan.name} - ${billingCycle} subscription`,
      prefill: {
        name: user.full_name || user.email,
        email: user.email,
      },
      theme: {
        color: '#3B82F6',
      },
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order - Full details:', {
      error,
      errorType: error?.constructor?.name,
      message: error?.message,
      code: error?.code,
      statusCode: error?.statusCode,
      description: error?.error?.description,
      field: error?.error?.field,
      source: error?.error?.source,
      step: error?.error?.step,
      reason: error?.error?.reason,
      metadata: error?.error?.metadata,
      stack: error?.stack,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set',
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set',
    });
    
    // Return more specific error message for debugging
    const errorMessage = error?.message || 'Unknown error';
    const errorDescription = error?.error?.description || errorMessage;
    const isEnvError = errorMessage.includes('key_id') || errorMessage.includes('key_secret');
    
    return NextResponse.json({ 
      error: isEnvError ? 'Payment configuration error' : 'Failed to create order',
      details: errorDescription,
      code: error?.code || error?.error?.code,
      field: error?.error?.field,
    }, { status: 500 });
  }
}