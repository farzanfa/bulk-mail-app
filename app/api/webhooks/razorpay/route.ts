import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';
import { isValidWebhookSource, maskSensitiveData } from '@/lib/razorpay-security';
import { SubscriptionStatus, RecipientStatus } from '@prisma/client';

// Disable body parsing to access raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook source IP (if needed)
    const forwardedFor = headers().get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    
    if (!isValidWebhookSource(ip)) {
      console.warn(`Webhook request from unauthorized IP: ${ip}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.text();
    const signature = headers().get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Validate webhook secret is configured
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);
    
    // Log sanitized event data for debugging
    console.log('Event data:', maskSensitiveData(event));

    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
      
      case 'subscription.halted':
      case 'subscription.cancelled':
      case 'subscription.paused':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      
      case 'subscription.pending':
        await handleSubscriptionPending(event.payload.subscription.entity);
        break;
      
      case 'subscription.resumed':
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    // Update payment record
    await prisma.payments.updateMany({
      where: { razorpay_order_id: payment.order_id },
      data: {
        razorpay_payment_id: payment.id,
        status: 'paid',
        payment_method: payment.method,
        updated_at: new Date(),
      },
    });

    // If this is a subscription payment, update subscription status
    const paymentRecord = await prisma.payments.findFirst({
      where: { razorpay_order_id: payment.order_id },
      include: { subscription: true },
    });

    if (paymentRecord?.subscription) {
      await prisma.user_subscriptions.update({
        where: { id: paymentRecord.subscription.id },
        data: {
          status: SubscriptionStatus.active,
          updated_at: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
    throw error;
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    await prisma.payments.updateMany({
      where: { razorpay_order_id: payment.order_id },
      data: {
        razorpay_payment_id: payment.id,
        status: 'failed',
        payment_method: payment.method,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

async function handleSubscriptionActivated(subscription: any) {
  try {
    await prisma.user_subscriptions.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: {
        status: 'active',
        current_period_start: new Date(subscription.current_start * 1000),
        current_period_end: new Date(subscription.current_end * 1000),
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling subscription activated:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  try {
    await prisma.user_subscriptions.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: {
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
    throw error;
  }
}

async function handleSubscriptionPending(subscription: any) {
  try {
    await prisma.user_subscriptions.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: {
        status: SubscriptionStatus.trialing, // Using trialing for pending payment
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling subscription pending:', error);
    throw error;
  }
}

async function handleSubscriptionCharged(subscription: any) {
  try {
    // Update subscription period when charged
    await prisma.user_subscriptions.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: {
        status: SubscriptionStatus.active,
        current_period_start: new Date(subscription.current_start * 1000),
        current_period_end: new Date(subscription.current_end * 1000),
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling subscription charged:', error);
    throw error;
  }
}

async function handleSubscriptionResumed(subscription: any) {
  try {
    await prisma.user_subscriptions.updateMany({
      where: { razorpay_subscription_id: subscription.id },
      data: {
        status: SubscriptionStatus.active,
        cancel_at_period_end: false,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling subscription resumed:', error);
    throw error;
  }
}

async function handleOrderPaid(order: any) {
  try {
    // Update payment record when order is paid
    await prisma.payments.updateMany({
      where: { razorpay_order_id: order.id },
      data: {
        status: 'paid',
        updated_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Error handling order paid:', error);
    throw error;
  }
}