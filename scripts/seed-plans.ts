import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding subscription plans...');

  // Create default plans
  const plans = [
    {
      name: 'Free Plan',
      type: PlanType.free,
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
    {
      name: 'Starter Plan',
      type: PlanType.starter,
      price_monthly: 29,
      price_yearly: 290,
      emails_per_month: 5000,
      contacts_limit: 2500,
      templates_limit: 10,
      campaigns_limit: 20,
      team_members: 3,
      custom_branding: false,
      priority_support: false,
      api_access: false,
      advanced_analytics: false,
    },
    {
      name: 'Professional Plan',
      type: PlanType.professional,
      price_monthly: 79,
      price_yearly: 790,
      emails_per_month: 25000,
      contacts_limit: 10000,
      templates_limit: 50,
      campaigns_limit: 100,
      team_members: 10,
      custom_branding: true,
      priority_support: true,
      api_access: true,
      advanced_analytics: true,
    },
    {
      name: 'Enterprise Plan',
      type: PlanType.enterprise,
      price_monthly: 199,
      price_yearly: 1990,
      emails_per_month: 100000,
      contacts_limit: 50000,
      templates_limit: -1, // unlimited
      campaigns_limit: -1, // unlimited
      team_members: -1, // unlimited
      custom_branding: true,
      priority_support: true,
      api_access: true,
      advanced_analytics: true,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.plans.findUnique({
      where: { type: plan.type }
    });

    if (existing) {
      console.log(`✅ Plan ${plan.name} already exists, updating...`);
      await prisma.plans.update({
        where: { type: plan.type },
        data: plan,
      });
    } else {
      console.log(`➕ Creating plan: ${plan.name}`);
      await prisma.plans.create({
        data: plan,
      });
    }
  }

  console.log('✨ Plans seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });