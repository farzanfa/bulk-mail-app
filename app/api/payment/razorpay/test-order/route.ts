import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('Razorpay test-order endpoint called');
  
  try {
    // Check environment
    const config = {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      keyIdPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 8) + '...',
      mode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live') ? 'live' : 'test',
    };
    
    // Try to create a minimal test order
    const testOrderData = {
      amount: 100, // 1 INR in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        purpose: 'configuration_test',
      },
    };
    
    console.log('Creating test order with data:', testOrderData);
    
    const order = await razorpay.orders.create(testOrderData);
    
    console.log('Test order created successfully:', {
      orderId: order.id,
      status: order.status,
      amount: order.amount,
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Razorpay configuration is working correctly',
      config,
      testOrder: {
        id: order.id,
        status: order.status,
        amount: order.amount,
        created_at: order.created_at,
      },
    });
  } catch (error: any) {
    console.error('Test order creation failed:', {
      error,
      message: error?.message,
      code: error?.error?.code,
      description: error?.error?.description,
      statusCode: error?.statusCode,
    });
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to create test order',
      error: {
        message: error?.message || 'Unknown error',
        code: error?.error?.code,
        description: error?.error?.description,
        statusCode: error?.statusCode,
      },
      config: {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      },
    }, { status: 500 });
  }
}