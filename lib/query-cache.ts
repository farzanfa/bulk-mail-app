import { prisma } from './db';

// Simple in-memory cache for frequently accessed data
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Cache key generators
  userPlan(userId: string) {
    return `user_plan:${userId}`;
  }

  userStats(userId: string) {
    return `user_stats:${userId}`;
  }

  campaignStats(userId: string) {
    return `campaign_stats:${userId}`;
  }

  planLimits(userId: string) {
    return `plan_limits:${userId}`;
  }
}

export const queryCache = new QueryCache();

// Optimized query helpers
export const optimizedQueries = {
  async getUserPlanWithCache(userId: string) {
    const cacheKey = queryCache.userPlan(userId);
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const plan = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    queryCache.set(cacheKey, plan, 10 * 60 * 1000); // 10 minutes
    return plan;
  },

  async getUserStatsWithCache(userId: string) {
    const cacheKey = queryCache.userStats(userId);
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const stats = await Promise.all([
      prisma.campaigns.count({ where: { user_id: userId } }),
      prisma.contacts.count({ where: { user_id: userId } }),
      prisma.templates.count({ where: { user_id: userId } }),
      prisma.google_accounts.count({ where: { user_id: userId } })
    ]);

    const result = {
      totalCampaigns: stats[0],
      totalContacts: stats[1],
      totalTemplates: stats[2],
      totalGoogleAccounts: stats[3]
    };

    queryCache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes
    return result;
  },

  async getCampaignStatsWithCache(userId: string) {
    const cacheKey = queryCache.campaignStats(userId);
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = await Promise.all([
      prisma.campaign_recipients.count({ 
        where: { 
          status: 'sent', 
          campaign: { user_id: userId }, 
          created_at: { gte: since24h } 
        } 
      }),
      prisma.campaign_recipients.count({ 
        where: { 
          status: 'failed', 
          campaign: { user_id: userId }, 
          created_at: { gte: since24h } 
        } 
      }),
      prisma.campaign_recipients.count({ 
        where: { 
          status: 'pending', 
          campaign: { user_id: userId, status: 'running' } 
        } 
      })
    ]);

    const result = {
      sent24h: stats[0],
      failed24h: stats[1],
      pendingQueue: stats[2]
    };

    queryCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes
    return result;
  }
};

// Cache invalidation helpers
export const cacheInvalidation = {
  invalidateUser(userId: string) {
    queryCache.delete(queryCache.userPlan(userId));
    queryCache.delete(queryCache.userStats(userId));
    queryCache.delete(queryCache.campaignStats(userId));
    queryCache.delete(queryCache.planLimits(userId));
  },

  invalidateCampaigns(userId: string) {
    queryCache.delete(queryCache.campaignStats(userId));
  },

  invalidateUserStats(userId: string) {
    queryCache.delete(queryCache.userStats(userId));
  }
};
