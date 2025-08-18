import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Basic health check info
    const razorpayConfig: any = {
      keyIdConfigured: !!process.env.RAZORPAY_KEY_ID,
      keySecretConfigured: !!process.env.RAZORPAY_KEY_SECRET,
      webhookSecretConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
    };

    // If user is authenticated and is admin, show more details
    if (session?.user?.email && process.env.ADMIN_EMAILS?.includes(session.user.email)) {
      razorpayConfig.keyIdPrefix = process.env.RAZORPAY_KEY_ID?.substring(0, 8) + '...';
      razorpayConfig.mode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? 'test' : 
                            process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'live' : 'unknown';
    }

    // Check if configuration is complete
    const isConfigured = razorpayConfig.keyIdConfigured && razorpayConfig.keySecretConfigured;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      razorpay: razorpayConfig,
      configured: isConfigured,
      message: isConfigured ? 'Razorpay payment service is configured' : 
                             'Razorpay payment service is not properly configured',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
    }, { status: 500 });
  }
}