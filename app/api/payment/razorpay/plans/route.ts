import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withRetry } from '@/lib/prisma-retry';

export async function GET(req: NextRequest) {
  try {
    // Get all plans from database
    const plans = await withRetry(
      () => prisma.plans.findMany({
        orderBy: { price_monthly: 'asc' }
      }),
      { maxRetries: 3, initialDelay: 200 }
    );

    // Return formatted plan data
    return NextResponse.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        emails_per_month: plan.emails_per_month,
        contacts_limit: plan.contacts_limit,
      }))
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}