import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    };

    // Check database connection and plans
    let plans = [];
    let dbError = null;
    try {
      plans = await prisma.plans.findMany({
        orderBy: { price_monthly: 'asc' }
      });
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }

    // Check session
    const session = await getServerSession(authOptions);

    const result = {
      status: 'Setup Check',
      timestamp: new Date().toISOString(),
      environment: {
        ...envCheck,
        allConfigured: Object.values(envCheck).every(v => v === true)
      },
      database: {
        connected: !dbError,
        error: dbError,
        plansCount: plans.length,
        plans: plans.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          monthly: p.price_monthly,
          yearly: p.price_yearly
        }))
      },
      session: {
        authenticated: !!session,
        user: session?.user?.email || null
      },
      nextSteps: []
    };

    // Add next steps based on what's missing
    if (!envCheck.RAZORPAY_KEY_ID || !envCheck.RAZORPAY_KEY_SECRET) {
      result.nextSteps.push('Configure Razorpay API keys in .env file');
    }
    if (!envCheck.NEXTAUTH_SECRET) {
      result.nextSteps.push('Set NEXTAUTH_SECRET in .env file');
    }
    if (dbError) {
      result.nextSteps.push('Fix database connection');
    }
    if (plans.length === 0) {
      result.nextSteps.push('Run: npx tsx scripts/seed-plans.ts');
    }

    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Test setup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check setup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}