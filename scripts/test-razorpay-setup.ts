#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

console.log('🔍 Testing Razorpay Setup...\n');

// Check environment variables
const envChecks = {
  'RAZORPAY_KEY_ID': process.env.RAZORPAY_KEY_ID,
  'RAZORPAY_KEY_SECRET': process.env.RAZORPAY_KEY_SECRET,
  'POSTGRES_URL': process.env.POSTGRES_URL,
};

console.log('📋 Environment Variables:');
Object.entries(envChecks).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: NOT SET`);
  } else if (key.includes('SECRET') || key.includes('POSTGRES')) {
    console.log(`✅ ${key}: SET (hidden for security)`);
  } else {
    console.log(`✅ ${key}: ${value}`);
  }
});

// Check if credentials are placeholders
if (process.env.RAZORPAY_KEY_ID?.includes('REPLACE')) {
  console.log('\n⚠️  WARNING: RAZORPAY_KEY_ID still contains placeholder value!');
  console.log('   Please update it with your actual Razorpay Key ID');
}

if (process.env.RAZORPAY_KEY_SECRET?.includes('REPLACE')) {
  console.log('\n⚠️  WARNING: RAZORPAY_KEY_SECRET still contains placeholder value!');
  console.log('   Please update it with your actual Razorpay Secret');
}

// Test Razorpay connection
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
    !process.env.RAZORPAY_KEY_ID.includes('REPLACE') && 
    !process.env.RAZORPAY_KEY_SECRET.includes('REPLACE')) {
  
  console.log('\n🔌 Testing Razorpay Connection...');
  
  try {
    const { default: Razorpay } = await import('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    try {
      const plans = await razorpay.plans.all({ count: 1 });
      console.log('✅ Razorpay connection successful!');
      console.log(`   Found ${plans?.count || 0} plans in your account`);
    } catch (error: any) {
      console.log('❌ Razorpay connection failed!');
      console.log(`   Error: ${error?.message || error}`);
      console.log('\n   Possible issues:');
      console.log('   - Invalid credentials');
      console.log('   - Using live mode credentials instead of test mode');
      console.log('   - Network connectivity issues');
    }
  } catch (error) {
    console.log('❌ Failed to initialize Razorpay client');
    console.log(`   Error: ${error}`);
  }
} else {
  console.log('\n⏭️  Skipping Razorpay connection test (credentials not configured)');
}

// Test database connection (without importing TS files)
if (process.env.POSTGRES_URL) {
  console.log('\n🗄️  Testing Database Connection...');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const plans = await prisma.plans.findMany();
      console.log(`✅ Database connected! Found ${plans.length} plans:`);
      plans.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.type}): $${plan.price_monthly}/mo, $${plan.price_yearly}/yr`);
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log(`   Error: ${error}`);
  }
} else {
  console.log('\n⏭️  Skipping database test (POSTGRES_URL not configured)');
}

console.log('\n📝 Next Steps:');
console.log('1. Update .env.local with your actual Razorpay credentials');
console.log('2. Create subscription plans in Razorpay Dashboard');
console.log('3. Update plan IDs in .env.local');
console.log('4. Restart your development server');
console.log('5. Try the payment flow again');