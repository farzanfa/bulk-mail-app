import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SubscriptionStatus } from '@prisma/client';

// Mark route as dynamic since it uses authentication
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as any).user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // First check if user has a subscription
    const subscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
      include: {
        plan: true,
      },
    });

    if (subscription) {
      return NextResponse.json(subscription);
    }

    // If no subscription, create a free plan subscription
    const freePlan = await prisma.plans.findUnique({
      where: { type: 'free' },
    });

    if (!freePlan) {
      return NextResponse.json({ error: 'Free plan not found' }, { status: 500 });
    }

    const newSubscription = await prisma.user_subscriptions.create({
      data: {
        user_id: userId,
        plan_id: freePlan.id,
        status: SubscriptionStatus.active,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json(newSubscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}