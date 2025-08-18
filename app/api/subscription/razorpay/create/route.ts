import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { 
  createRazorpayCustomer, 
  createRazorpayPlan, 
  createRazorpaySubscription,
  amountToPaise 
} from '@/lib/razorpay';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSubscriptionSchema = z.object({
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

    const body = await request.json();
    const validation = createSubscriptionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { planId, billingCycle } = validation.data;

    // Get plan and user details
    const [plan, user] = await Promise.all([
      prisma.plans.findUnique({ where: { id: planId } }),
      prisma.users.findUnique({ where: { id: userId } }),
    ]);

    if (!plan || !user) {
      return NextResponse.json({ error: 'Plan or user not found' }, { status: 404 });
    }

    if (plan.type === 'free') {
      return NextResponse.json({ error: 'Cannot create subscription for free plan' }, { status: 400 });
    }

    // Check existing subscription
    const existingSubscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
    });

    // Create or get Razorpay customer
    let razorpayCustomerId = existingSubscription?.razorpay_customer_id;
    
    if (!razorpayCustomerId) {
      const customer = await createRazorpayCustomer({
        name: user.name || user.email,
        email: user.email,
        notes: {
          userId: user.id,
        },
      });
      razorpayCustomerId = customer.id;
    }

    // Create Razorpay plan
    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const razorpayPlanId = `plan_${planId}_${billingCycle}`;
    
    try {
      await createRazorpayPlan({
        planId: razorpayPlanId,
        name: `${plan.name} - ${billingCycle}`,
        amount: amountToPaise(amount),
        currency: 'INR',
        period: billingCycle === 'yearly' ? 'yearly' : 'monthly',
        interval: 1,
        description: plan.features.join(', '),
        notes: {
          planId,
          billingCycle,
        },
      });
    } catch (error: any) {
      // Plan might already exist, which is fine
      if (!error.message?.includes('already exists')) {
        throw error;
      }
    }

    // Create Razorpay subscription
    const razorpaySubscription = await createRazorpaySubscription({
      planId: razorpayPlanId,
      customerId: razorpayCustomerId,
      totalCount: billingCycle === 'yearly' ? 12 : 120, // 1 year or 10 years max
      notes: {
        userId,
        planId,
        billingCycle,
      },
    });

    // Update or create subscription record
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: 'pending',
      payment_gateway: 'razorpay',
      razorpay_customer_id: razorpayCustomerId,
      razorpay_subscription_id: razorpaySubscription.id,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      updated_at: new Date(),
    };

    if (existingSubscription) {
      await prisma.user_subscriptions.update({
        where: { id: existingSubscription.id },
        data: subscriptionData,
      });
    } else {
      await prisma.user_subscriptions.create({
        data: subscriptionData,
      });
    }

    return NextResponse.json({
      subscriptionId: razorpaySubscription.id,
      shortUrl: razorpaySubscription.short_url,
      amount,
      currency: 'INR',
      planName: plan.name,
      billingCycle,
    });
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}