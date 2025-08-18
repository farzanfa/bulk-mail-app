#!/usr/bin/env node

/**
 * Script to test Razorpay configuration
 */

require('dotenv').config();

console.log('Testing Razorpay Configuration...\n');

// Check environment variables
const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
let hasErrors = false;

console.log('1. Checking environment variables:');
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✓ ${varName} is set`);
  } else {
    console.log(`   ✗ ${varName} is NOT set`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please ensure all Razorpay environment variables are set in your .env file.');
  process.exit(1);
}

// Test Razorpay connection
console.log('\n2. Testing Razorpay API connection:');
const Razorpay = require('razorpay');

try {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  // Try to create a test order
  razorpay.orders.create({
    amount: 100, // 1 INR in paise
    currency: 'INR',
    receipt: 'test_' + Date.now(),
  })
  .then(order => {
    console.log('   ✓ Successfully created test order:', order.id);
    console.log('\n✅ Razorpay configuration is working correctly!');
  })
  .catch(error => {
    console.log('   ✗ Failed to create test order');
    console.log('   Error:', error.error || error.message || error);
    console.log('\n❌ Razorpay API connection failed!');
    console.log('Please check your API keys and ensure they are valid.');
  });
} catch (error) {
  console.log('   ✗ Failed to initialize Razorpay');
  console.log('   Error:', error.message);
  console.log('\n❌ Razorpay initialization failed!');
}