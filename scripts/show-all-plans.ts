import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showAllPlans() {
  console.log('📊 ALL PLANS IN YOUR POSTGRESQL DATABASE\n');
  console.log('Database URL:', process.env.POSTGRES_URL?.split('@')[1] || 'Not configured');
  console.log('=====================================\n');

  try {
    const plans = await prisma.plans.findMany({
      orderBy: { price_monthly: 'asc' }
    });

    if (plans.length === 0) {
      console.log('❌ No plans found in database!');
      return;
    }

    console.log(`✅ Found ${plans.length} plans in PostgreSQL:\n`);

    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name.toUpperCase()}`);
      console.log('   ------------------------');
      console.log(`   Database ID: ${plan.id}`);
      console.log(`   Type: ${plan.type}`);
      console.log(`   Monthly Price: $${plan.price_monthly}`);
      console.log(`   Yearly Price: $${plan.price_yearly}`);
      console.log(`   Emails/Month: ${plan.emails_per_month.toLocaleString()}`);
      console.log(`   Contacts Limit: ${plan.contacts_limit.toLocaleString()}`);
      console.log(`   Templates: ${plan.templates_limit === -1 ? 'Unlimited' : plan.templates_limit}`);
      console.log(`   Campaigns: ${plan.campaigns_limit === -1 ? 'Unlimited' : plan.campaigns_limit}`);
      console.log(`   Team Members: ${plan.team_members === -1 ? 'Unlimited' : plan.team_members}`);
      console.log(`   Features:`);
      if (plan.custom_branding) console.log(`     ✓ Custom Branding`);
      if (plan.priority_support) console.log(`     ✓ Priority Support`);
      if (plan.api_access) console.log(`     ✓ API Access`);
      if (plan.advanced_analytics) console.log(`     ✓ Advanced Analytics`);
      console.log(`   Created: ${plan.created_at.toISOString()}`);
      console.log(`   Updated: ${plan.updated_at.toISOString()}`);
      console.log('');
    });

    // Also show raw SQL query result
    console.log('\n📝 RAW SQL QUERY RESULT:');
    const rawPlans = await prisma.$queryRaw`
      SELECT id, name, type, price_monthly, price_yearly 
      FROM plans 
      ORDER BY price_monthly ASC
    `;
    console.table(rawPlans);

  } catch (error) {
    console.error('❌ Error fetching plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showAllPlans();