import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription && session.customer) {
          const userId = session.metadata?.userId;
          if (!userId) {
            throw new Error('No userId in session metadata');
          }

          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Get the plan details from metadata or price lookup
          const planId = session.metadata?.planId;
          if (!planId) {
            throw new Error('No planId in session metadata');
          }

          // Update user subscription in database
          await prisma.user_subscriptions.upsert({
            where: { user_id: userId },
            update: {
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              plan_id: planId,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              payment_gateway: 'stripe',
            },
            create: {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              plan_id: planId,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              payment_gateway: 'stripe',
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        await prisma.user_subscriptions.update({
          where: { stripe_subscription_id: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'active' : 
                   subscription.status === 'trialing' ? 'trialing' :
                   subscription.status === 'canceled' ? 'cancelled' : 'expired',
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as cancelled
        await prisma.user_subscriptions.update({
          where: { stripe_subscription_id: subscription.id },
          data: {
            status: 'cancelled',
          },
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          const subscription = await prisma.user_subscriptions.findUnique({
            where: { stripe_subscription_id: invoice.subscription as string },
          });

          if (subscription) {
            // Create payment record
            await prisma.payments.create({
              data: {
                subscription_id: subscription.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount: invoice.amount_paid / 100, // Convert from cents
                currency: invoice.currency.toUpperCase(),
                status: 'succeeded',
                payment_gateway: 'stripe',
              },
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          const subscription = await prisma.user_subscriptions.findUnique({
            where: { stripe_subscription_id: invoice.subscription as string },
          });

          if (subscription) {
            // Create failed payment record
            await prisma.payments.create({
              data: {
                subscription_id: subscription.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount: invoice.amount_due / 100, // Convert from cents
                currency: invoice.currency.toUpperCase(),
                status: 'failed',
                payment_gateway: 'stripe',
              },
            });

            // Optionally update subscription status
            await prisma.user_subscriptions.update({
              where: { id: subscription.id },
              data: {
                status: 'expired', // or handle based on your business logic
              },
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}