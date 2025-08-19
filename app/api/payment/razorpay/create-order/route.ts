import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRazorpayOrder, RAZORPAY_PLANS } from '@/lib/razorpay';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as any).user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { planId, billingCycle } = await req.json();

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'Plan ID and billing cycle are required' },
        { status: 400 }
      );
    }

    // Get plan details from database
    const plan = await prisma.plans.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get the plan configuration
    const planConfig = RAZORPAY_PLANS[plan.type as keyof typeof RAZORPAY_PLANS];
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Plan configuration not found' },
        { status: 500 }
      );
    }

    const amount = billingCycle === 'yearly' 
      ? plan.price_yearly 
      : plan.price_monthly;

    // Create Razorpay order
    // Note: amount is already in dollars from database, createRazorpayOrder will convert to cents
    const order = await createRazorpayOrder(
      amount,
      'USD',
      `order_${userId}_${Date.now()}`,
      {
        userId,
        planId: plan.id,
        planType: plan.type,
        billingCycle,
      }
    );

    // Get or create user subscription record
    const existingSubscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
    });

    if (!existingSubscription) {
      // Create a new subscription record with pending status
      await prisma.user_subscriptions.create({
        data: {
          user_id: userId,
          plan_id: planId,
          status: 'trialing', // Will be updated to active after payment
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          payment_gateway: 'razorpay',
        },
      });
    }

    // Return order details for frontend
    return NextResponse.json({
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'MailApp',
      description: `${plan.name} - ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
      order_id: order.id,
      prefill: {
        name: session.user.name || '',
        email: session.user.email || '',
      },
      theme: {
        color: '#3B82F6',
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return more specific error message if available
    const errorMessage = error instanceof Error 
      ? `Failed to create order: ${error.message}`
      : 'Failed to create order';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}