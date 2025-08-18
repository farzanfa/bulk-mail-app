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

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is not scheduled for cancellation' }, { status: 400 });
    }

    // Check if subscription hasn't already expired
    if (new Date() > new Date(subscription.current_period_end)) {
      return NextResponse.json({ error: 'Subscription has already expired' }, { status: 400 });
    }

    // Resume subscription
    const updatedSubscription = await prisma.user_subscriptions.update({
      where: { id: subscription.id },
      data: {
        cancel_at_period_end: false,
        updated_at: new Date(),
      },
      include: {
        plan: true,
      },
    });

    // TODO: If using Razorpay, also resume the subscription in Razorpay
    // if (subscription.razorpay_subscription_id && subscription.payment_gateway === 'razorpay') {
    //   // Implement Razorpay subscription resume logic here
    // }

    return NextResponse.json({
      message: 'Subscription has been resumed',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}