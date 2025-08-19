import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlans() {
  try {
    const plans = await prisma.plans.findMany({
      orderBy: { price_monthly: 'asc' }
    });
    
    console.log('Plans in database:');
    console.log('==================');
    plans.forEach(plan => {
      console.log(`${plan.name} (${plan.type}): $${plan.price_monthly}/month, $${plan.price_yearly}/year`);
    });
    
    const subscriptions = await prisma.user_subscriptions.count();
    console.log(`\nTotal subscriptions: ${subscriptions}`);
    
    const payments = await prisma.payments.count();
    console.log(`Total payments: ${payments}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();