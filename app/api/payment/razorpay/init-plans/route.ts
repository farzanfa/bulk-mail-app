import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withRetry } from '@/lib/prisma-retry';

// This endpoint seeds the database with default plans if they don't exist
export async function POST(req: NextRequest) {
  try {
    // Check authorization header for security
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY || 'development-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default plans data
    const defaultPlans = [
      {
        name: 'Free Plan',
        type: 'free',
        price_monthly: 0,
        price_yearly: 0,
        emails_per_month: 100,
        contacts_limit: 100,
        templates_limit: 3,
        campaigns_limit: 5,
        team_members: 1,
        custom_branding: false,
        priority_support: false,
        api_access: false,
        advanced_analytics: false,
      },
      {
        name: 'Starter Plan',
        type: 'starter',
        price_monthly: 29,
        price_yearly: 290,
        emails_per_month: 5000,
        contacts_limit: 2500,
        templates_limit: 10,
        campaigns_limit: 20,
        team_members: 3,
        custom_branding: false,
        priority_support: false,
        api_access: false,
        advanced_analytics: false,
      },
      {
        name: 'Professional Plan',
        type: 'professional',
        price_monthly: 75,
        price_yearly: 750,
        emails_per_month: 25000,
        contacts_limit: 10000,
        templates_limit: 50,
        campaigns_limit: 100,
        team_members: 10,
        custom_branding: true,
        priority_support: true,
        api_access: true,
        advanced_analytics: true,
      },
      {
        name: 'Enterprise Plan',
        type: 'enterprise',
        price_monthly: 100,
        price_yearly: 1000,
        emails_per_month: 100000,
        contacts_limit: 50000,
        templates_limit: -1, // unlimited
        campaigns_limit: -1, // unlimited
        team_members: -1, // unlimited
        custom_branding: true,
        priority_support: true,
        api_access: true,
        advanced_analytics: true,
      },
    ];

    const results = [];
    
    for (const plan of defaultPlans) {
      const result = await withRetry(
        () => prisma.plans.upsert({
          where: { type: plan.type },
          update: plan,
          create: plan,
        }),
        { maxRetries: 3, initialDelay: 200 }
      );
      
      results.push({
        type: result.type,
        id: result.id,
        name: result.name,
        action: result.id === plan.type ? 'created' : 'updated'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Plans initialized successfully',
      plans: results
    });
  } catch (error) {
    console.error('Error initializing plans:', error);
    return NextResponse.json(
      { error: 'Failed to initialize plans' },
      { status: 500 }
    );
  }
}