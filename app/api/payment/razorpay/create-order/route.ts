import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRazorpayOrder } from '@/lib/razorpay';
import { convertUSDtoINR, getFormattedPrices } from '@/lib/currency-converter';
import { prisma } from '@/lib/db';
import { withRetry } from '@/lib/prisma-retry';

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

    // Get plan details from database with retry logic
    console.log(`🔍 Looking for plan with ID: ${planId}`);
    let plan = await withRetry(
      () => prisma.plans.findUnique({
        where: { id: planId },
      }),
      { maxRetries: 3, initialDelay: 200 }
    );

    // If plan not found by ID, try to find by type (for backward compatibility)
    if (!plan) {
      console.log(`⚠️ Plan not found by ID, trying to find by type...`);
      
      // Extract plan type from the ID if it contains it (e.g., if ID contains "starter", "professional", etc.)
      const planTypes = ['free', 'starter', 'professional', 'enterprise'];
      let planType = planTypes.find(type => planId.toLowerCase().includes(type));
      
      // If we couldn't extract from ID, check if planId itself is a plan type
      if (!planType && planTypes.includes(planId.toLowerCase())) {
        planType = planId.toLowerCase();
      }
      
      if (planType) {
        console.log(`🔍 Looking for plan with type: ${planType}`);
        plan = await withRetry(
          () => prisma.plans.findUnique({
            where: { type: planType },
          }),
          { maxRetries: 3, initialDelay: 200 }
        );
        
        if (plan) {
          console.log(`✅ Found plan by type: ${plan.name} (${plan.type})`);
        }
      }
    }

    if (!plan) {
      console.error(`❌ Plan not found: ${planId}`);
      console.error('Available plans in database:');
      const availablePlans = await prisma.plans.findMany({
        select: { id: true, type: true, name: true }
      });
      console.error(JSON.stringify(availablePlans, null, 2));
      
      return NextResponse.json({ 
        error: 'Plan not found',
        message: 'The selected plan does not exist. Please refresh the page and try again.',
        planId,
      }, { status: 404 });
    }
    console.log(`✅ Found plan: ${plan.name} (${plan.type})`)

    // Disallow payment attempts for the free plan
    if (plan.type === 'free' || ((plan.price_monthly || 0) === 0 && (plan.price_yearly || 0) === 0)) {
      console.warn(`⚠️ Payment requested for free plan (${plan.id}/${plan.type}). Blocking order creation.`);
      return NextResponse.json(
        { 
          error: 'Free plan does not require payment',
          action: 'downgrade'
        },
        { status: 400 }
      );
    }

    // Get USD amount from database
    const usdAmount = billingCycle === 'yearly' 
      ? plan.price_yearly 
      : plan.price_monthly;

    // Convert USD to INR using live rates with timeout and error handling
    let inrAmount: number;
    let formattedPrices: any;
    
    try {
      // Add timeout for currency conversion (10 seconds total)
      const conversionPromise = convertUSDtoINR(usdAmount);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Currency conversion timeout')), 10000)
      );
      
      inrAmount = await Promise.race([conversionPromise, timeoutPromise]);
      console.log(`✅ Converting ${usdAmount} USD to ${inrAmount} INR for ${plan.type} plan`);
      
      // Get formatted prices for display
      formattedPrices = await getFormattedPrices(usdAmount);
    } catch (conversionError) {
      console.error('⚠️ Currency conversion failed, using fallback rate:', conversionError);
      // Use fallback rate of 83.50 INR per USD
      const fallbackRate = 83.50;
      inrAmount = Math.round(usdAmount * fallbackRate * 100) / 100;
      
      formattedPrices = {
        usd: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(usdAmount),
        inr: new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(inrAmount),
        rate: fallbackRate,
        rateSource: 'Fallback (API unavailable)'
      };
    }

    // Create Razorpay order with error handling
    let order;
    try {
      // Note: amount is now in INR (converted from USD), createRazorpayOrder will convert to paise
      order = await createRazorpayOrder(
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
      console.log(`✅ Created Razorpay order: ${order.id}`);
    } catch (razorpayError) {
      console.error('❌ Razorpay order creation failed:', razorpayError);
      
      // Check if it's a credentials issue
      if (razorpayError instanceof Error && 
          (razorpayError.message.includes('key_id') || 
           razorpayError.message.includes('key_secret') ||
           razorpayError.message.includes('Invalid key'))) {
        return NextResponse.json(
          { 
            error: 'Payment gateway configuration error. Please check Razorpay credentials.',
            details: 'Invalid Razorpay API credentials'
          },
          { status: 503 }
        );
      }
      
      throw razorpayError;
    }

    // Get or create user subscription record with retry logic
    const existingSubscription = await withRetry(
      () => prisma.user_subscriptions.findUnique({
        where: { user_id: userId },
      }),
      { maxRetries: 3, initialDelay: 200 }
    );

    if (!existingSubscription) {
      // Create a new subscription record with pending status
      await withRetry(
        () => prisma.user_subscriptions.create({
          data: {
            user_id: userId,
            plan_id: planId,
            status: 'trialing', // Will be updated to active after payment
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            payment_gateway: 'razorpay',
          },
        }),
        { maxRetries: 3, initialDelay: 200 }
      );
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
      // Log environment info for debugging
      env: {
        hasRazorpayKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasRazorpayKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      }
    });
    
    // Return more specific error message based on error type
    let errorMessage = 'Failed to create order';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('credentials') || 
          error.message.includes('key_id') || 
          error.message.includes('key_secret')) {
        errorMessage = 'Payment gateway not properly configured';
        statusCode = 503;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        statusCode = 504;
      } else if (error.message.includes('network') || 
                 error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
        statusCode = 503;
      } else {
        errorMessage = `Failed to create order: ${error.message}`;
      }
    }
      
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  } finally {
    // Don't disconnect the shared Prisma instance
    // The global instance manages its own connections
  }
}