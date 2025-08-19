import { prisma } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin';

export type Plan = 'free' | 'beta' | 'admin' | 'pro';

function isBetaEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.BETA_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function getUserPlan(userId: string): Promise<Plan> {
  // First check if user has a subscription
  const subscription = await prisma.user_subscriptions.findUnique({
    where: { user_id: userId },
    include: { plan: true }
  });

  if (subscription && subscription.status === 'active') {
    // Map database plan types to our internal plan types
    switch (subscription.plan.type) {
      case 'starter':
      case 'professional':
      case 'enterprise':
        return 'pro';
      default:
        return 'free';
    }
  }

  // Fall back to email-based plan determination
  const user = await prisma.users.findUnique({ where: { id: userId }, select: { email: true } });
  const email = user?.email;
  if (!email) return 'free';
  if (isAdminEmail(email)) return 'admin';
  if (isBetaEmail(email)) return 'beta';
  return 'free';
}

// Legacy constants for backward compatibility
export const FREE_LIMITS = {
  maxTemplates: 2,
  maxUploads: 2,
  maxContacts: 50,
  maxMailsPerCampaign: 100
};

// Legacy plan features - these will be replaced by database values
export const PLAN_FEATURES = {
  free: {
    maxGmailAccounts: 1,
    maxTemplates: 2,
    maxUploads: 2,
    maxContacts: 50,
    maxMailsPerCampaign: 100,
    analytics: 'basic',
    support: 'community'
  },
  beta: {
    maxGmailAccounts: 1,
    maxTemplates: -1, // Unlimited
    maxUploads: -1,   // Unlimited
    maxContacts: -1,  // Unlimited
    maxMailsPerCampaign: -1, // Unlimited
    analytics: 'advanced',
    support: 'direct'
  },
  pro: {
    maxGmailAccounts: 1,
    maxTemplates: -1, // Unlimited
    maxUploads: -1,   // Unlimited
    maxContacts: -1,  // Unlimited
    maxMailsPerCampaign: -1, // Unlimited
    analytics: 'advanced',
    support: 'priority'
  },
  admin: {
    maxGmailAccounts: 10, // Admins can connect multiple accounts
    maxTemplates: -1,     // Unlimited
    maxUploads: -1,       // Unlimited
    maxContacts: -1,      // Unlimited
    maxMailsPerCampaign: -1, // Unlimited
    analytics: 'advanced',
    support: 'priority'
  }
};

// New function to get plan limits from database
export async function getPlanLimits(userId: string) {
  // First check if user is admin - admins bypass all limits
  const user = await prisma.users.findUnique({ 
    where: { id: userId }, 
    select: { email: true } 
  });
  
  if (user?.email && isAdminEmail(user.email)) {
    // Return unlimited values for all limits for admin users
    return {
      maxTemplates: -1,
      maxUploads: -1,
      maxContacts: -1,
      maxMailsPerCampaign: -1,
      maxCampaigns: -1,
      teamMembers: -1,
      customBranding: true,
      prioritySupport: true,
      apiAccess: true,
      advancedAnalytics: true
    };
  }

  const subscription = await prisma.user_subscriptions.findUnique({
    where: { user_id: userId },
    include: { plan: true }
  });

  if (subscription && subscription.status === 'active') {
    const plan = subscription.plan;
    return {
      maxTemplates: plan.templates_limit,
      maxUploads: -1, // Not specified in DB, using unlimited
      maxContacts: plan.contacts_limit,
      maxMailsPerCampaign: plan.emails_per_month,
      maxCampaigns: plan.campaigns_limit,
      teamMembers: plan.team_members,
      customBranding: plan.custom_branding,
      prioritySupport: plan.priority_support,
      apiAccess: plan.api_access,
      advancedAnalytics: plan.advanced_analytics
    };
  }

  // Fall back to legacy system
  const planType = await getUserPlan(userId);
  const features = PLAN_FEATURES[planType];
  
  return {
    maxTemplates: features.maxTemplates,
    maxUploads: features.maxUploads,
    maxContacts: features.maxContacts,
    maxMailsPerCampaign: features.maxMailsPerCampaign,
    maxCampaigns: planType === 'free' ? 5 : -1,
    teamMembers: 1,
    customBranding: false,
    prioritySupport: planType === 'pro' || planType === 'admin',
    apiAccess: false,
    advancedAnalytics: features.analytics === 'advanced'
  };
}

export function formatPlanName(plan: Plan): string {
  switch (plan) {
    case 'admin':
      return 'Admin';
    case 'pro':
      return 'Pro';
    case 'beta':
      return 'Beta';
    case 'free':
      return 'Free';
    default:
      return plan.charAt(0).toUpperCase() + plan.slice(1);
  }
}

export async function canConnectGmailAccount(userId: string): Promise<boolean> {
  // Check if user is admin first
  const user = await prisma.users.findUnique({ 
    where: { id: userId }, 
    select: { email: true } 
  });
  
  if (user?.email && isAdminEmail(user.email)) {
    return true; // Admins can always connect more accounts
  }
  
  const plan = await getUserPlan(userId);
  const currentAccounts = await prisma.google_accounts.count({ where: { user_id: userId } });
  const maxAccounts = PLAN_FEATURES[plan].maxGmailAccounts;
  
  return currentAccounts < maxAccounts;
}


