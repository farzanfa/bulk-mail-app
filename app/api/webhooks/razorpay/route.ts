import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { prisma } from '@/lib/db';
import { kv } from '@/lib/kv';
import crypto from 'node:crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const eventHeaderId = req.headers.get('x-razorpay-event-id');

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

    // Parse payload
    let event: any;
    try {
      event = JSON.parse(body);
    } catch (e: any) {
      console.error('Webhook JSON parse error:', e?.message || e);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Idempotency: avoid processing the same event twice
    const computedId = crypto.createHash('sha256').update(body).digest('hex');
    const eventId = event?.id || eventHeaderId || computedId;
    const dedupeKey = `rzp:webhook:${eventId}`;
    try {
      const already = await kv.get(dedupeKey);
      if (already) {
        console.log('Duplicate webhook received, skipping', { eventId, eventType: event?.event });
        return NextResponse.json({ received: true, duplicate: true });
      }
      await kv.set(dedupeKey, true, { ex: 60 * 60 * 24 }); // 24h
    } catch (e) {
      console.warn('KV not available for idempotency; continuing anyway');
    }

    const { event: eventType, payload } = event;
    if (!eventType || !payload) {
      console.error('Webhook missing required fields', { hasEvent: !!eventType, hasPayload: !!payload });
      return NextResponse.json(
        { error: 'Malformed webhook: missing event or payload' },
        { status: 400 }
      );
    }

    try {
      switch (eventType) {
        case 'payment.captured':
          if (!payload?.payment?.entity) {
            return NextResponse.json({ error: 'Missing payment entity' }, { status: 400 });
          }
          await handlePaymentCaptured(payload.payment.entity);
          break;

        case 'payment.failed':
          if (!payload?.payment?.entity) {
            return NextResponse.json({ error: 'Missing payment entity' }, { status: 400 });
          }
          await handlePaymentFailed(payload.payment.entity);
          break;

        case 'subscription.activated':
          if (!payload?.subscription?.entity) {
            return NextResponse.json({ error: 'Missing subscription entity' }, { status: 400 });
          }
          await handleSubscriptionActivated(payload.subscription.entity);
          break;

        case 'subscription.completed':
          if (!payload?.subscription?.entity) {
            return NextResponse.json({ error: 'Missing subscription entity' }, { status: 400 });
          }
          await handleSubscriptionCompleted(payload.subscription.entity);
          break;

        case 'subscription.cancelled':
          if (!payload?.subscription?.entity) {
            return NextResponse.json({ error: 'Missing subscription entity' }, { status: 400 });
          }
          await handleSubscriptionCancelled(payload.subscription.entity);
          break;

        case 'subscription.halted':
          if (!payload?.subscription?.entity) {
            return NextResponse.json({ error: 'Missing subscription entity' }, { status: 400 });
          }
          await handleSubscriptionHalted(payload.subscription.entity);
          break;

        default:
          console.log(`Unhandled event type: ${eventType}`);
          return NextResponse.json({ received: true, unhandled: eventType }, { status: 202 });
      }
    } catch (handlerError: any) {
      console.error('Webhook handler error:', handlerError?.message || handlerError, { eventType });
      return NextResponse.json({ error: 'Webhook handler failed', eventType }, { status: 500 });
    }

    return NextResponse.json({ received: true, eventId, eventType });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  } finally {
    // Don't disconnect the shared Prisma instance
    // The global instance manages its own connections
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
  } else {
    console.warn('Payment.captured received but no existing payment found', { id, order_id });
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
  } else {
    console.warn('Payment.failed received but no existing payment found', { id, order_id, error_description });
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
  } else {
    console.warn('Subscription.activated received but subscription not found', { id, customer_id, status });
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
  } else {
    console.warn('Subscription.completed received but subscription not found', { id });
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
  } else {
    console.warn('Subscription.cancelled received but subscription not found', { id });
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
  } else {
    console.warn('Subscription.halted received but subscription not found', { id });
  }
}