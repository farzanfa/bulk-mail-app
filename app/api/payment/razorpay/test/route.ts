import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { convertUSDtoINR, getUSDtoINRRate } from '@/lib/currency-converter';
import { getRazorpayInstance } from '@/lib/razorpay';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Test results object
    const tests = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        isVercel: !!process.env.VERCEL,
      },
      auth: {
        hasSession: !!session,
        userEmail: session?.user?.email || 'no-session',
      },
      razorpay: {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        keyIdLength: process.env.RAZORPAY_KEY_ID?.length || 0,
        canInitialize: false,
        error: null as string | null,
      },
      currency: {
        canFetchRate: false,
        rate: null as number | null,
        source: null as string | null,
        convertedAmount: null as number | null,
        error: null as string | null,
      },
      database: {
        canConnect: false,
        plansCount: 0,
        error: null as string | null,
      },
    };

    // Test Razorpay initialization
    try {
      const razorpay = getRazorpayInstance();
      tests.razorpay.canInitialize = true;
    } catch (error) {
      tests.razorpay.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test currency conversion
    try {
      const rate = await getUSDtoINRRate();
      tests.currency.canFetchRate = true;
      tests.currency.rate = rate;
      
      // Get cached rate info
      const formattedPrices = await convertUSDtoINR(100);
      tests.currency.convertedAmount = formattedPrices;
    } catch (error) {
      tests.currency.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test database connection
    try {
      const plans = await prisma.plans.count();
      tests.database.canConnect = true;
      tests.database.plansCount = plans;
    } catch (error) {
      tests.database.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      tests,
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}