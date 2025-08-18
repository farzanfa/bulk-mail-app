import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Get the user's subscription
    const subscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    if (subscription.status !== 'active') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    // Update subscription to cancel at period end
    const updatedSubscription = await prisma.user_subscriptions.update({
      where: { id: subscription.id },
      data: {
        cancel_at_period_end: true,
        updated_at: new Date(),
      },
      include: {
        plan: true,
      },
    });

    // TODO: If using Stripe, also cancel the subscription in Stripe
    // if (subscription.stripe_subscription_id) {
    //   await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    //     cancel_at_period_end: true,
    //   });
    // }

    return NextResponse.json({
      message: 'Subscription will be cancelled at the end of the billing period',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}