import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent activities from various sources
    const [recentUsers, recentCampaigns, recentEmails] = await Promise.all([
      // Recent user signups
      prisma.users.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          created_at: true
        }
      }),
      // Recent campaign launches
      prisma.campaigns.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          created_at: true,
          user: {
            select: { email: true }
          }
        }
      }),
      // Recent email activities (from campaign recipients)
      prisma.campaign_recipients.findMany({
        take: 20,
        orderBy: { created_at: 'desc' },
        where: {
          status: { in: ['sent', 'failed'] }
        },
        select: {
          id: true,
          status: true,
          created_at: true,
          campaign: {
            select: {
              name: true,
              user: { select: { email: true } }
            }
          }
        }
      })
    ]);

    // Transform data into activity format
    const activities = [
      // User signups
      ...recentUsers.map(user => ({
        id: `user_${user.id}`,
        type: 'user_signup' as const,
        description: `New user signed up: ${user.email}`,
        timestamp: user.created_at.toISOString(),
        severity: 'info' as const,
        userId: user.id,
        userEmail: user.email
      })),
      // Campaign launches
      ...recentCampaigns.map(campaign => ({
        id: `campaign_${campaign.id}`,
        type: 'campaign_launch' as const,
        description: `Campaign "${campaign.name}" ${campaign.status} by ${campaign.user.email}`,
        timestamp: campaign.created_at.toISOString(),
        severity: campaign.status === 'running' ? 'info' : 'warning' as const,
        userId: campaign.user.email,
        userEmail: campaign.user.email
      })),
      // Email activities
      ...recentEmails.map(email => ({
        id: `email_${email.id}`,
        type: 'email_sent' as const,
        description: `Email ${email.status} for campaign "${email.campaign.name}"`,
        timestamp: email.created_at.toISOString(),
        severity: email.status === 'sent' ? 'info' : 'error' as const,
        userId: email.campaign.user.email,
        userEmail: email.campaign.user.email
      }))
    ];

    // Sort by timestamp and take the most recent 30
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30);

    return NextResponse.json({ activities: sortedActivities });
  } catch (error) {
    console.error('Failed to fetch admin activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 });
  }
}
