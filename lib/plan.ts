import { prisma } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin';

export type Plan = 'free' | 'beta' | 'admin' | 'pro';

function isBetaEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.BETA_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.users.findUnique({ where: { id: userId }, select: { email: true } });
  const email = user?.email;
  if (!email) return 'free';
  if (isAdminEmail(email)) return 'admin';
  if (isBetaEmail(email)) return 'beta';
  return 'free';
}

export const FREE_LIMITS = {
  maxTemplates: 2,
  maxUploads: 2,
  maxContacts: 50,
  maxMailsPerCampaign: 100
};

export const PLAN_FEATURES = {
  free: {
    maxGmailAccounts: 1,
    maxTemplates: 2,
    maxUploads: 2,
    maxContacts: 50,
    maxMailsPerCampaign: 100
  },
  beta: {
    maxGmailAccounts: 1,
    maxTemplates: 5,
    maxUploads: 5,
    maxContacts: 200,
    maxMailsPerCampaign: 500
  },
  pro: {
    maxGmailAccounts: 1,
    maxTemplates: 20,
    maxUploads: 20,
    maxContacts: 1000,
    maxMailsPerCampaign: 2000
  },
  admin: {
    maxGmailAccounts: 10, // Admins can connect multiple accounts
    maxTemplates: 100,
    maxUploads: 100,
    maxContacts: 10000,
    maxMailsPerCampaign: 10000
  }
};

export async function canConnectGmailAccount(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const currentAccounts = await prisma.google_accounts.count({ where: { user_id: userId } });
  const maxAccounts = PLAN_FEATURES[plan].maxGmailAccounts;
  
  return currentAccounts < maxAccounts;
}


