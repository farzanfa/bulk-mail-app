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

    // Get the user's subscription to find Razorpay customer ID
    const subscription = await prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
    });

    // TODO: Integrate with Razorpay to fetch actual payment methods
    // if (subscription?.razorpay_customer_id && subscription.payment_gateway === 'razorpay') {
    //   // Implement Razorpay payment methods fetch logic here
    //   
    //   return NextResponse.json({
    //     paymentMethods: paymentMethods.data.map(pm => ({
    //       id: pm.id,
    //       type: pm.type,
    //       last4: pm.card?.last4,
    //       brand: pm.card?.brand,
    //       exp_month: pm.card?.exp_month,
    //       exp_year: pm.card?.exp_year,
    //       is_default: pm.id === defaultPaymentMethodId,
    //     }))
    //   });
    // }

    // For now, return mock data or empty array
    return NextResponse.json({
      paymentMethods: [],
      message: 'Payment methods integration pending'
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}