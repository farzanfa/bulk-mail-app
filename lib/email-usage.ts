import { prisma } from '@/lib/db';
import { getPlanLimits } from '@/lib/plan';

export async function getCurrentMonthEmailUsage(userId: string): Promise<{ used: number; limit: number; remaining: number }> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  
  // Get or create usage record for current month
  const usage = await prisma.email_usage.upsert({
    where: {
      user_id_year_month: {
        user_id: userId,
        year,
        month
      }
    },
    update: {},
    create: {
      user_id: userId,
      year,
      month,
      emails_sent: 0
    }
  });
  
  // Get plan limits
  const planLimits = await getPlanLimits(userId);
  const limit = planLimits.maxMailsPerCampaign; // This is actually emails per month in the new system
  
  return {
    used: usage.emails_sent,
    limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - usage.emails_sent)
  };
}

export async function canSendEmails(userId: string, count: number): Promise<{ allowed: boolean; reason?: string }> {
  const usage = await getCurrentMonthEmailUsage(userId);
  
  if (usage.limit === -1) {
    return { allowed: true };
  }
  
  if (usage.remaining < count) {
    return {
      allowed: false,
      reason: `Monthly email limit exceeded. You have ${usage.remaining} emails remaining out of ${usage.limit} for this month.`
    };
  }
  
  return { allowed: true };
}

export async function incrementEmailUsage(userId: string, count: number): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  await prisma.email_usage.upsert({
    where: {
      user_id_year_month: {
        user_id: userId,
        year,
        month
      }
    },
    update: {
      emails_sent: { increment: count }
    },
    create: {
      user_id: userId,
      year,
      month,
      emails_sent: count
    }
  });
}