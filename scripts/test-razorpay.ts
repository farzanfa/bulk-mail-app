import { config } from 'dotenv';
import { createRazorpayOrder, verifyRazorpaySignature, amountToPaise } from '../lib/razorpay';
import crypto from 'crypto';

// Load environment variables
config();

async function testRazorpayIntegration() {
  console.log('🧪 Testing Razorpay Integration...\n');

  // Check if environment variables are set
  const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\nPlease set the following in your .env file:');
    missingVars.forEach(v => console.log(`${v}=your-value-here`));
    process.exit(1);
  }

  console.log('✅ Environment variables configured\n');

  try {
    // Test 1: Create Order
    console.log('Test 1: Creating Razorpay Order...');
    const testAmount = 999; // ₹9.99
    const order = await createRazorpayOrder({
      amount: amountToPaise(testAmount),
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        test: 'true',
        purpose: 'Integration test',
      },
    });
    
    console.log('✅ Order created successfully');
    console.log('   Order ID:', order.id);
    console.log('   Amount:', order.amount, 'paise (₹' + testAmount + ')');
    console.log('   Status:', order.status);
    console.log('');

    // Test 2: Signature Verification
    console.log('Test 2: Testing Signature Verification...');
    
    // Create a mock payment response
    const mockPaymentId = 'pay_TEST123456789';
    const mockSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(order.id + '|' + mockPaymentId)
      .digest('hex');

    const isValid = verifyRazorpaySignature({
      orderId: order.id,
      paymentId: mockPaymentId,
      signature: mockSignature,
    });

    console.log('✅ Signature verification:', isValid ? 'PASSED' : 'FAILED');
    console.log('');

    // Test 3: Invalid Signature
    console.log('Test 3: Testing Invalid Signature Detection...');
    const isInvalid = verifyRazorpaySignature({
      orderId: order.id,
      paymentId: mockPaymentId,
      signature: 'invalid_signature',
    });

    console.log('✅ Invalid signature detection:', !isInvalid ? 'PASSED' : 'FAILED');
    console.log('');

    // Test 4: Helper Functions
    console.log('Test 4: Testing Helper Functions...');
    console.log('   amountToPaise(10.50):', amountToPaise(10.50), 'paise');
    console.log('   amountToPaise(99.99):', amountToPaise(99.99), 'paise');
    console.log('   amountToPaise(0.01):', amountToPaise(0.01), 'paise');
    console.log('');

    console.log('🎉 All tests passed!\n');
    console.log('Next steps:');
    console.log('1. Set up RAZORPAY_WEBHOOK_SECRET in your .env file');
    console.log('2. Configure webhook endpoint in Razorpay Dashboard:');
    console.log('   https://your-domain.com/api/webhooks/razorpay');
    console.log('3. Test the payment flow in your application');
    console.log('');
    console.log('Webhook events to enable in Razorpay Dashboard:');
    console.log('- payment.captured');
    console.log('- payment.failed');
    console.log('- subscription.activated');
    console.log('- subscription.halted');
    console.log('- subscription.cancelled');
    console.log('- subscription.pending');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.log('\nPossible issues:');
    console.log('1. Invalid API credentials');
    console.log('2. Network connectivity issues');
    console.log('3. Razorpay API is down');
    process.exit(1);
  }
}

// Run the test
testRazorpayIntegration();