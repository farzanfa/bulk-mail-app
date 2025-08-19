import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkDatabase() {
  console.log('🔍 Checking database connection and tables...\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Check if tables exist by running raw query
    const tables = await prisma.$queryRaw<Array<{tablename: string}>>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    console.log('📊 Tables in database:');
    tables.forEach(table => console.log(`  - ${table.tablename}`));
    console.log('');

    // Check plans table specifically
    console.log('📋 Checking plans table:');
    const plansCount = await prisma.plans.count();
    console.log(`  Total plans: ${plansCount}`);
    
    if (plansCount > 0) {
      const plans = await prisma.plans.findMany({
        orderBy: { price_monthly: 'asc' }
      });
      
      console.log('\n  Plans in database:');
      plans.forEach(plan => {
        console.log(`    - ${plan.name} (${plan.type}): $${plan.price_monthly}/mo, $${plan.price_yearly}/yr`);
      });
    } else {
      console.log('  ⚠️  No plans found in database!');
    }

    // Check users table
    console.log('\n👥 Checking users table:');
    const usersCount = await prisma.users.count();
    console.log(`  Total users: ${usersCount}`);

    // Check if we can create a plan
    console.log('\n🧪 Testing data insertion...');
    const testPlan = await prisma.plans.upsert({
      where: { type: 'free' },
      update: {
        name: 'Free Plan',
        price_monthly: 0,
        price_yearly: 0,
        emails_per_month: 100,
        contacts_limit: 100,
        templates_limit: 3,
        campaigns_limit: 5,
        team_members: 1,
        custom_branding: false,
        priority_support: false,
        api_access: false,
        advanced_analytics: false,
      },
      create: {
        name: 'Free Plan',
        type: 'free',
        price_monthly: 0,
        price_yearly: 0,
        emails_per_month: 100,
        contacts_limit: 100,
        templates_limit: 3,
        campaigns_limit: 5,
        team_members: 1,
        custom_branding: false,
        priority_support: false,
        api_access: false,
        advanced_analytics: false,
      }
    });
    console.log(`  ✅ Successfully upserted plan: ${testPlan.name}`);

    // Final count
    const finalCount = await prisma.plans.count();
    console.log(`\n📊 Final plans count: ${finalCount}`);

  } catch (error) {
    console.error('❌ Database error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();