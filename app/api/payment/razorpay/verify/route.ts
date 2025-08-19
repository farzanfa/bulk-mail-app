import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { convertUSDtoINR } from '@/lib/currency-converter';
import { prisma } from '@/lib/db';

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

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      billingCycle 
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify the payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Get user's subscription
    const subscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Use billing cycle from request or determine from plan prices
    const isYearly = billingCycle === 'yearly' || 
                     (!billingCycle && subscription.plan.price_yearly && 
                      subscription.plan.price_monthly && 
                      subscription.plan.price_yearly <= subscription.plan.price_monthly * 12);
    
    const billingPeriodDays = isYearly ? 365 : 30;
    
    // Get USD amount and convert to INR
    const usdAmount = isYearly 
      ? subscription.plan.price_yearly 
      : subscription.plan.price_monthly;
    
    const inrAmount = await convertUSDtoINR(usdAmount);
    console.log(`Payment verification: ${usdAmount} USD = ${inrAmount} INR`);

    // Update subscription status to active
    const updatedSubscription = await prisma.user_subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(
          Date.now() + billingPeriodDays * 24 * 60 * 60 * 1000
        ),
      },
    });

    // Create payment record
    await prisma.payments.create({
      data: {
        subscription_id: subscription.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: inrAmount,
        currency: 'INR',
        status: 'captured',
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  } finally {
    // Don't disconnect the shared Prisma instance
    // The global instance manages its own connections
  }
}