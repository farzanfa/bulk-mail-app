#!/usr/bin/env node

/**
 * Test script to simulate the create-order flow
 */

const fetch = require('node-fetch');

async function testCreateOrder() {
  const baseUrl = process.env.BASE_URL || 'https://mailweaver.farzanfa.com';
  
  console.log('Testing create-order endpoint...\n');
  
  // Test with different scenarios
  const testCases = [
    {
      name: 'Valid starter plan - monthly',
      data: {
        planId: 'starter',  // Assuming this matches a plan type
        billingCycle: 'monthly'
      }
    },
    {
      name: 'Valid professional plan - yearly',
      data: {
        planId: 'professional',
        billingCycle: 'yearly'
      }
    },
    {
      name: 'Invalid plan ID',
      data: {
        planId: 'invalid-plan',
        billingCycle: 'monthly'
      }
    }
  ];
  
  for (const test of testCases) {
    console.log(`\nTest: ${test.name}`);
    console.log('Request:', JSON.stringify(test.data, null, 2));
    
    try {
      const response = await fetch(`${baseUrl}/api/payment/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header if you have a test token
          // 'Cookie': 'next-auth.session-token=your-test-token'
        },
        body: JSON.stringify(test.data)
      });
      
      const data = await response.json();
      console.log('Response:', response.status, JSON.stringify(data, null, 2));
      
      if (response.status === 500) {
        console.log('⚠️  500 Error detected!');
        if (data.details) {
          console.log('Error details:', data.details);
        }
      }
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  }
}

// Add command line option to test with session token
if (process.argv[2] === '--help') {
  console.log('Usage: node test-create-order.js [session-token]');
  console.log('If session token is provided, it will be used for authentication');
  process.exit(0);
}

testCreateOrder().catch(console.error);