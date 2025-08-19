import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(payload.subscription.entity);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(payload.subscription.entity);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.subscription.entity);
        break;

      case 'subscription.halted':
        await handleSubscriptionHalted(payload.subscription.entity);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function handlePaymentCaptured(payment: any) {
  const { id, order_id, amount, currency, method } = payment;

  // Find the payment record
  const existingPayment = await prisma.payments.findUnique({
    where: { razorpay_payment_id: id },
  });

  if (existingPayment) {
    // Update payment status
    await prisma.payments.update({
      where: { id: existingPayment.id },
      data: {
        status: 'captured',
        amount: amount / 100, // Convert from paise to rupees
        currency: currency.toUpperCase(),
        payment_method: method,
      },
    });
  }
}

async function handlePaymentFailed(payment: any) {
  const { id, order_id, error_description } = payment;

  // Find the payment record
  const existingPayment = await prisma.payments.findUnique({
    where: { razorpay_payment_id: id },
  });

  if (existingPayment) {
    // Update payment status
    await prisma.payments.update({
      where: { id: existingPayment.id },
      data: {
        status: 'failed',
      },
    });
  }
}

async function handleSubscriptionActivated(subscription: any) {
  const { id, customer_id, status, current_start, current_end } = subscription;

  // Find subscription by Razorpay subscription ID
  const userSubscription = await prisma.user_subscriptions.findUnique({
    where: { razorpay_subscription_id: id },
  });

  if (userSubscription) {
    await prisma.user_subscriptions.update({
      where: { id: userSubscription.id },
      data: {
        status: 'active',
        current_period_start: new Date(current_start * 1000),
        current_period_end: new Date(current_end * 1000),
        razorpay_customer_id: customer_id,
      },
    });
  }
}

async function handleSubscriptionCompleted(subscription: any) {
  const { id } = subscription;

  const userSubscription = await prisma.user_subscriptions.findUnique({
    where: { razorpay_subscription_id: id },
  });

  if (userSubscription) {
    await prisma.user_subscriptions.update({
      where: { id: userSubscription.id },
      data: {
        status: 'expired',
      },
    });
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  const { id } = subscription;

  const userSubscription = await prisma.user_subscriptions.findUnique({
    where: { razorpay_subscription_id: id },
  });

  if (userSubscription) {
    await prisma.user_subscriptions.update({
      where: { id: userSubscription.id },
      data: {
        status: 'cancelled',
        cancel_at_period_end: true,
      },
    });
  }
}

async function handleSubscriptionHalted(subscription: any) {
  const { id } = subscription;

  const userSubscription = await prisma.user_subscriptions.findUnique({
    where: { razorpay_subscription_id: id },
  });

  if (userSubscription) {
    await prisma.user_subscriptions.update({
      where: { id: userSubscription.id },
      data: {
        status: 'expired',
      },
    });
  }
}