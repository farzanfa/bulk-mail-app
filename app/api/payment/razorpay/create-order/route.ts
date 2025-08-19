import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRazorpayOrder, RAZORPAY_PLANS } from '@/lib/razorpay';
import { convertUSDtoINR, getFormattedPrices } from '@/lib/currency-converter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Check for required environment variables first
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Missing Razorpay environment variables');
      return NextResponse.json(
        { 
          error: 'Payment gateway not configured. Please contact support.',
          details: 'Missing Razorpay credentials'
        },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as any).user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { planId, billingCycle } = await req.json();
    console.log(`📝 Create order request: planId=${planId}, billingCycle=${billingCycle}, userId=${userId}`);

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'Plan ID and billing cycle are required' },
        { status: 400 }
      );
    }

    // Get plan details from database
    console.log(`🔍 Looking for plan with ID: ${planId}`);
    const plan = await prisma.plans.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      console.error(`❌ Plan not found: ${planId}`);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    console.log(`✅ Found plan: ${plan.name} (${plan.type})`)

    // Get the plan configuration
    const planConfig = RAZORPAY_PLANS[plan.type as keyof typeof RAZORPAY_PLANS];
    if (!planConfig) {
      console.error(`❌ Plan configuration not found for type: ${plan.type}`);
      console.error('Available plan types:', Object.keys(RAZORPAY_PLANS));
      return NextResponse.json(
        { error: 'Plan configuration not found' },
        { status: 500 }
      );
    }

    // Get USD amount from database
    const usdAmount = billingCycle === 'yearly' 
      ? plan.price_yearly 
      : plan.price_monthly;

    // Convert USD to INR using live rates
    const inrAmount = await convertUSDtoINR(usdAmount);
    console.log(`Converting ${usdAmount} USD to ${inrAmount} INR for ${plan.type} plan`);

    // Get formatted prices for display
    const formattedPrices = await getFormattedPrices(usdAmount);

    // Create Razorpay order
    // Note: amount is now in INR (converted from USD), createRazorpayOrder will convert to paise
    const order = await createRazorpayOrder(
      inrAmount,
      'INR',
      `order_${userId}_${Date.now()}`,
      {
        userId,
        planId: plan.id,
        planType: plan.type,
        billingCycle,
        usdAmount: usdAmount.toString(),
        inrAmount: inrAmount.toString(),
        conversionRate: formattedPrices.rate.toString(),
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
      // Include conversion details for transparency
      notes: {
        payment_note: `${formattedPrices.usd} (${formattedPrices.inr} at ${formattedPrices.rate} INR/USD)`,
      },
      pricing: {
        usd: formattedPrices.usd,
        inr: formattedPrices.inr,
        rate: formattedPrices.rate,
        rateSource: formattedPrices.rateSource,
      },
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name || 'Unknown',
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