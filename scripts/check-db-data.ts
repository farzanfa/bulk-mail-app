import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const userCount = await prisma.users.count();
    const subscriptionCount = await prisma.user_subscriptions.count();
    const paymentCount = await prisma.payments.count();
    const campaignCount = await prisma.campaigns.count();
    const templateCount = await prisma.templates.count();

    console.log('Database Data Summary:');
    console.log('=====================');
    console.log(`Users: ${userCount}`);
    console.log(`Subscriptions: ${subscriptionCount}`);
    console.log(`Payments: ${paymentCount}`);
    console.log(`Campaigns: ${campaignCount}`);
    console.log(`Templates: ${templateCount}`);
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();