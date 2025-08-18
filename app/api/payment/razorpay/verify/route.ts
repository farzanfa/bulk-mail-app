import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { z } from 'zod';
import { SubscriptionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
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
    const validation = verifyPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validation.data;

    // Verify signature
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Get payment record
    const payment = await prisma.payments.findUnique({
      where: { razorpay_order_id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify the payment belongs to the current user
    if (payment.subscription.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update payment record
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
        updated_at: new Date(),
      },
    });

    // Update subscription status
    const now = new Date();
    const billingPeriodDays = payment.amount === payment.subscription.plan.price_yearly ? 365 : 30;
    const periodEnd = new Date(now.getTime() + billingPeriodDays * 24 * 60 * 60 * 1000);

    await prisma.user_subscriptions.update({
      where: { id: payment.subscription.id },
      data: {
        status: SubscriptionStatus.active,
        current_period_start: now,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        updated_at: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      subscription: {
        status: SubscriptionStatus.active,
        planName: payment.subscription.plan.name,
        validUntil: periodEnd,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}