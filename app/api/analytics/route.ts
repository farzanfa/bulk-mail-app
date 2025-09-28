import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits } from '@/lib/plan';
import { ensureUserIdFromSession } from '@/lib/user';
import { optimizedQueries, queryCache } from '@/lib/query-cache';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = await ensureUserIdFromSession(session).catch(() => '');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Get user's plan to determine analytics level (with caching)
  const cacheKey = queryCache.planLimits(userId);
  let planLimits = queryCache.get(cacheKey);
  if (!planLimits) {
    planLimits = await getPlanLimits(userId);
    queryCache.set(cacheKey, planLimits, 10 * 60 * 1000); // 10 minutes
  }
  const hasAdvancedAnalytics = planLimits.advancedAnalytics;
  
  // Basic analytics (available to all) - use optimized queries
  const userStats = await optimizedQueries.getUserStatsWithCache(userId);
  const [
    totalSent,
    totalFailed
  ] = await Promise.all([
    prisma.campaign_recipients.count({ where: { status: 'sent', campaign: { user_id: userId } } }),
    prisma.campaign_recipients.count({ where: { status: 'failed', campaign: { user_id: userId } } })
  ]);
  
  const basicAnalytics = {
    overview: {
      totalCampaigns: userStats.totalCampaigns,
      totalContacts: userStats.totalContacts,
      totalSent,
      totalFailed,
      successRate: totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(2) : 0
    }
  };
  
  if (!hasAdvancedAnalytics) {
    return NextResponse.json({
      analytics: basicAnalytics,
      advancedAnalyticsAvailable: false,
      message: 'Upgrade to a premium plan for advanced analytics'
    });
  }
  
  // Advanced analytics (premium plans only)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Engagement metrics by campaign
  const campaignMetrics = await prisma.campaigns.findMany({
    where: { 
      user_id: userId,
      created_at: { gte: thirtyDaysAgo }
    },
    select: {
      id: true,
      name: true,
      created_at: true,
      _count: {
        select: {
          recipients: {
            where: { status: 'sent' }
          }
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: 10
  });
  
  // Time-based analytics
  const hourlyDistribution = await prisma.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM last_attempt_at) as hour,
      COUNT(*) as count
    FROM campaign_recipients
    INNER JOIN campaigns ON campaign_recipients.campaign_id = campaigns.id
    WHERE campaigns.user_id = ${userId}
      AND campaign_recipients.status = 'sent'
      AND campaign_recipients.last_attempt_at >= ${thirtyDaysAgo}
    GROUP BY hour
    ORDER BY hour
  `;
  
  // Domain analytics
  const domainStats = await prisma.$queryRaw`
    SELECT 
      SUBSTRING(contacts.email FROM POSITION('@' IN contacts.email) + 1) as domain,
      COUNT(DISTINCT contacts.id) as contact_count,
      COUNT(CASE WHEN campaign_recipients.status = 'sent' THEN 1 END) as sent_count,
      COUNT(CASE WHEN campaign_recipients.status = 'failed' THEN 1 END) as failed_count
    FROM contacts
    LEFT JOIN campaign_recipients ON contacts.id = campaign_recipients.contact_id
    WHERE contacts.user_id = ${userId}
    GROUP BY domain
    ORDER BY contact_count DESC
    LIMIT 20
  `;
  
  // Performance trends
  const dailyTrends = await prisma.$queryRaw`
    SELECT 
      DATE(last_attempt_at) as date,
      COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
    FROM campaign_recipients
    INNER JOIN campaigns ON campaign_recipients.campaign_id = campaigns.id
    WHERE campaigns.user_id = ${userId}
      AND last_attempt_at >= ${thirtyDaysAgo}
    GROUP BY date
    ORDER BY date DESC
  `;
  
  return NextResponse.json({
    analytics: {
      ...basicAnalytics,
      campaigns: {
        recent: campaignMetrics.map(c => ({
          id: c.id,
          name: c.name,
          created_at: c.created_at,
          sent_count: c._count.recipients
        }))
      },
      engagement: {
        hourlyDistribution,
        domainStats,
        trends: dailyTrends
      },
      insights: {
        bestSendingHour: getBestSendingHour(hourlyDistribution as any),
        topDomains: getTopDomains(domainStats as any),
        averageDailyVolume: getAverageDailyVolume(dailyTrends as any)
      }
    },
    advancedAnalyticsAvailable: true
  });
}

function getBestSendingHour(hourlyData: Array<{ hour: number; count: bigint }>) {
  if (!hourlyData.length) return null;
  const best = hourlyData.reduce((prev, curr) => 
    Number(curr.count) > Number(prev.count) ? curr : prev
  );
  return {
    hour: best.hour,
    count: Number(best.count)
  };
}

function getTopDomains(domainData: Array<{ domain: string; contact_count: bigint; sent_count: bigint; failed_count: bigint }>) {
  return domainData.slice(0, 5).map(d => ({
    domain: d.domain,
    contacts: Number(d.contact_count),
    sent: Number(d.sent_count),
    failed: Number(d.failed_count),
    successRate: Number(d.sent_count) > 0 ? 
      ((Number(d.sent_count) / (Number(d.sent_count) + Number(d.failed_count))) * 100).toFixed(2) : 0
  }));
}

function getAverageDailyVolume(trendData: Array<{ date: Date; sent: bigint; failed: bigint }>) {
  if (!trendData.length) return 0;
  const totalSent = trendData.reduce((sum, day) => sum + Number(day.sent), 0);
  return Math.round(totalSent / trendData.length);
}