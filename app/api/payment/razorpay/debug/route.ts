import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const debug: any = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasNextAuth: !!process.env.NEXTAUTH_SECRET,
        razorpayConfigured: !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET,
      },
      checks: {
        session: false,
        database: false,
        plans: false,
        users: false,
      },
      errors: [],
    };

    // Check session
    try {
      const session = await getServerSession(authOptions);
      debug.checks.session = !!session;
      if (session) {
        debug.checks.sessionData = {
          hasUser: !!session.user,
          hasEmail: !!session.user?.email,
          hasId: !!(session as any).user?.id,
        };
      }
    } catch (error: any) {
      debug.errors.push({ type: 'session', message: error.message });
    }

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      debug.checks.database = true;
    } catch (error: any) {
      debug.errors.push({ type: 'database', message: error.message });
    }

    // Check if plans table exists and has data
    if (debug.checks.database) {
      try {
        const plansCount = await prisma.plans.count();
        debug.checks.plans = plansCount > 0;
        debug.checks.plansCount = plansCount;
      } catch (error: any) {
        debug.errors.push({ type: 'plans', message: error.message });
      }

      // Check if users table exists
      try {
        const usersCount = await prisma.users.count();
        debug.checks.users = usersCount > 0;
        debug.checks.usersCount = usersCount;
      } catch (error: any) {
        debug.errors.push({ type: 'users', message: error.message });
      }
    }

    return NextResponse.json(debug);
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test create order flow without actual payment
    const body = await request.json();
    const { planId, billingCycle } = body;

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      request: { planId, billingCycle },
      checks: {},
      errors: [],
    };

    // Check session
    try {
      const session = await getServerSession(authOptions);
      debugInfo.checks.session = !!session;
      debugInfo.checks.userId = (session as any)?.user?.id || null;
    } catch (error: any) {
      debugInfo.errors.push({ step: 'session', error: error.message });
    }

    // Check plan
    if (planId) {
      try {
        const plan = await prisma.plans.findUnique({
          where: { id: planId },
        });
        debugInfo.checks.planFound = !!plan;
        debugInfo.checks.planDetails = plan ? {
          name: plan.name,
          type: plan.type,
          priceMonthly: plan.price_monthly,
          priceYearly: plan.price_yearly,
        } : null;
      } catch (error: any) {
        debugInfo.errors.push({ step: 'fetchPlan', error: error.message });
      }
    }

    // Check user if we have session
    if (debugInfo.checks.userId) {
      try {
        const user = await prisma.users.findUnique({
          where: { id: debugInfo.checks.userId },
        });
        debugInfo.checks.userFound = !!user;
        debugInfo.checks.userEmail = user?.email || null;
      } catch (error: any) {
        debugInfo.errors.push({ step: 'fetchUser', error: error.message });
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}