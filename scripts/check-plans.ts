import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Checking plans in database...\n');
  
  const plans = await prisma.plans.findMany({
    orderBy: { price_monthly: 'asc' }
  });

  plans.forEach(plan => {
    console.log(`Plan: ${plan.name} (${plan.type})`);
    console.log(`  ID: ${plan.id}`);
    console.log(`  Monthly: $${plan.price_monthly}`);
    console.log(`  Yearly: $${plan.price_yearly}`);
    console.log(`  Emails/month: ${plan.emails_per_month}`);
    console.log(`  Contacts limit: ${plan.contacts_limit}`);
    console.log('---');
  });

  console.log('\n🔑 Use these plan IDs in your Razorpay configuration!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });