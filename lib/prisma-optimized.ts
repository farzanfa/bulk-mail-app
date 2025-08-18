import { PrismaClient } from '@prisma/client';

// Singleton pattern to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Connection pool optimization
    datasources: {
      db: {
        url: process.env.POSTGRES_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper function for common query patterns with optimized selects
export const optimizedQueries = {
  // Get user with minimal fields
  getUserBasic: async (userId: string) => {
    return prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        email_verified_at: true,
        onboarding_completed_at: true,
      },
    });
  },

  // Get user subscription with plan details
  getUserSubscription: async (userId: string) => {
    return prisma.user_subscriptions.findUnique({
      where: { user_id: userId },
      select: {
        id: true,
        status: true,
        expires_at: true,
        plan: {
          select: {
            type: true,
            name: true,
            monthly_email_limit: true,
            contact_limit: true,
            max_campaigns: true,
            features: true,
          },
        },
      },
    });
  },

  // Get campaigns with pagination and minimal fields
  getCampaigns: async (userId: string, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    
    const [campaigns, total] = await Promise.all([
      prisma.campaigns.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          name: true,
          status: true,
          created_at: true,
          updated_at: true,
          stats_sent: true,
          stats_failed: true,
          stats_total: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.campaigns.count({ where: { user_id: userId } }),
    ]);

    return { campaigns, total, page, limit };
  },

  // Get templates with pagination
  getTemplates: async (userId: string, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    
    const [templates, total] = await Promise.all([
      prisma.templates.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          name: true,
          subject: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.templates.count({ where: { user_id: userId } }),
    ]);

    return { templates, total, page, limit };
  },
};

// Export type-safe transaction helper
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback, {
    maxWait: 5000, // 5 seconds max wait
    timeout: 10000, // 10 seconds timeout
  });
}