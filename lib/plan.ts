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
  const email = user?.email ?? null;
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


