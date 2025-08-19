#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

const RAZORPAY_PLAN_IDS = {
  starter: {
    monthly: 'plan_R756ULe2ADKrAK',
    yearly: 'plan_R75C5I1wMcFKWJ'
  },
  professional: {
    monthly: 'plan_R75ENZQF1ZP3fk',
    yearly: 'plan_R75Euuno76irUT'
  },
  enterprise: {
    monthly: 'plan_R75FKqSLzCEm5D',
    yearly: 'plan_R75FVzznhMhvVA'
  }
};

async function updateRazorpayPlanIds() {
  try {
    console.log('🔄 Updating Razorpay Plan IDs in database...\n');

    // Update each plan type
    for (const [planType, ids] of Object.entries(RAZORPAY_PLAN_IDS)) {
      console.log(`Updating ${planType} plan...`);
      
      const result = await prisma.plans.update({
        where: { type: planType },
        data: {
          razorpay_plan_id: ids
        }
      });

      console.log(`✅ Updated ${result.name}:`);
      console.log(`   Monthly: ${ids.monthly}`);
      console.log(`   Yearly: ${ids.yearly}\n`);
    }

    // Verify all updates
    console.log('📋 Verifying all plan IDs:\n');
    const allPlans = await prisma.plans.findMany({
      where: {
        type: {
          in: ['starter', 'professional', 'enterprise']
        }
      },
      orderBy: {
        price_monthly: 'asc'
      }
    });

    allPlans.forEach(plan => {
      console.log(`${plan.name} (${plan.type}):`);
      console.log(`  Price: $${plan.price_monthly}/mo, $${plan.price_yearly}/yr`);
      console.log(`  Razorpay IDs: ${JSON.stringify(plan.razorpay_plan_id, null, 2)}\n`);
    });

    console.log('✅ All Razorpay plan IDs have been updated successfully!');
    console.log('\n🎉 Your payment integration should now work correctly.');
    console.log('   Restart your server to ensure all changes take effect.');

  } catch (error) {
    console.error('❌ Error updating plan IDs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateRazorpayPlanIds();