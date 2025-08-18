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

    // Get user's subscription
    const subscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Can't cancel free plan
    if (subscription.plan.type === 'free') {
      return NextResponse.json({ error: 'Cannot cancel free plan' }, { status: 400 });
    }

    // Update subscription to cancel at period end
    const updatedSubscription = await prisma.user_subscriptions.update({
      where: { id: subscription.id },
      data: {
        cancel_at_period_end: true,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription scheduled for cancellation',
      cancel_at: updatedSubscription.current_period_end,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}