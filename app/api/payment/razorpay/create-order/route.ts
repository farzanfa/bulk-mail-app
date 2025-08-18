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
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as any).user.id;
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
    const plan = await prisma.plans.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if plan is free
    if (plan.type === 'free') {
      return NextResponse.json({ error: 'Cannot create order for free plan' }, { status: 400 });
    }

    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

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
        name: user.name || '',
        email: user.email,
      },
      theme: {
        color: '#3B82F6',
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}