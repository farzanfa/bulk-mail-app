import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Map of plan types to Razorpay plan IDs from environment variables
const razorpayPlanMapping = {
  starter: {
    monthly: process.env.RAZORPAY_PLAN_STARTER_MONTHLY,
    yearly: process.env.RAZORPAY_PLAN_STARTER_YEARLY,
  },
  professional: {
    monthly: process.env.RAZORPAY_PLAN_PROFESSIONAL_MONTHLY,
    yearly: process.env.RAZORPAY_PLAN_PROFESSIONAL_YEARLY,
  },
  enterprise: {
    monthly: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY,
    yearly: process.env.RAZORPAY_PLAN_ENTERPRISE_YEARLY,
  },
};

async function updateRazorpayPlans() {
  try {
    console.log('Updating Razorpay plan mappings...\n');

    // Get all plans from database
    const plans = await prisma.plans.findMany({
      orderBy: { price_monthly: 'asc' }
    });

    console.log('Current plans in database:');
    console.log('========================');
    for (const plan of plans) {
      console.log(`- ${plan.name} (${plan.type})`);
      console.log(`  Monthly: ₹${plan.price_monthly * 83} (~$${plan.price_monthly})`);
      console.log(`  Yearly: ₹${plan.price_yearly * 83} (~$${plan.price_yearly})`);
      
      // Show which Razorpay plan IDs should be mapped
      if (plan.type !== 'free') {
        const mapping = razorpayPlanMapping[plan.type as keyof typeof razorpayPlanMapping];
        if (mapping) {
          console.log(`  Razorpay Monthly Plan ID: ${mapping.monthly || 'NOT SET'}`);
          console.log(`  Razorpay Yearly Plan ID: ${mapping.yearly || 'NOT SET'}`);
        }
      }
      console.log('');
    }

    // Check if all required environment variables are set
    console.log('\nEnvironment Variable Status:');
    console.log('===========================');
    const requiredVars = [
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'RAZORPAY_PLAN_STARTER_MONTHLY',
      'RAZORPAY_PLAN_STARTER_YEARLY',
      'RAZORPAY_PLAN_PROFESSIONAL_MONTHLY',
      'RAZORPAY_PLAN_PROFESSIONAL_YEARLY',
      'RAZORPAY_PLAN_ENTERPRISE_MONTHLY',
      'RAZORPAY_PLAN_ENTERPRISE_YEARLY',
    ];

    let allSet = true;
    for (const varName of requiredVars) {
      const value = process.env[varName];
      const status = value ? '✅ SET' : '❌ NOT SET';
      console.log(`${varName}: ${status}`);
      if (!value) allSet = false;
    }

    if (!allSet) {
      console.log('\n⚠️  Some environment variables are missing!');
      console.log('Please update your .env file with the values from Razorpay dashboard.');
    } else {
      console.log('\n✅ All environment variables are configured!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRazorpayPlans();