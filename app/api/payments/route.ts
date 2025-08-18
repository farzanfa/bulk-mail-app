import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    // Get user's subscription
    const subscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
    });

    if (!subscription) {
      return NextResponse.json([]);
    }

    // Get payments for the subscription
    const payments = await prisma.payments.findMany({
      where: { 
        subscription_id: subscription.id,
        status: {
          in: ['paid', 'pending', 'failed']
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50, // Limit to last 50 payments
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}