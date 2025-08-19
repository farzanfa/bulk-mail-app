import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  stripe, 
  getOrCreateStripeCustomer, 
  createCheckoutSession,
  getStripeUrls,
  STRIPE_PRICE_IDS
} from '@/lib/stripe';
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

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      userId,
      session.user.email!,
      session.user.name || undefined
    );

    // Get the appropriate price ID
    const priceIds = STRIPE_PRICE_IDS[plan.type as keyof typeof STRIPE_PRICE_IDS];
    if (!priceIds) {
      return NextResponse.json(
        { error: 'Stripe prices not configured for this plan' },
        { status: 500 }
      );
    }

    const priceId = billingCycle === 'yearly' ? priceIds.yearly : priceIds.monthly;
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${billingCycle} billing` },
        { status: 500 }
      );
    }

    // Get URLs for redirect
    const { successUrl, cancelUrl } = getStripeUrls(req);

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId,
      priceId,
      successUrl,
      cancelUrl,
      metadata: {
        userId,
        planId: plan.id,
        planType: plan.type,
        billingCycle,
      },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}