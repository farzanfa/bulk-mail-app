import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get total counts
    const [
      totalUsers,
      totalUploads,
      totalTemplates,
      totalCampaigns,
      totalContacts,
      totalEmailsSent,
      totalEmailsFailed
    ] = await Promise.all([
      prisma.users.count(),
      prisma.uploads.count(),
      prisma.templates.count(),
      prisma.campaigns.count(),
      prisma.contacts.count(),
      prisma.campaign_recipients.count({ where: { status: 'sent' } }),
      prisma.campaign_recipients.count({ where: { status: 'failed' } })
    ]);

    // Get 24h activity
    const [
      activeUsers24h,
      newUsers24h,
      uploads24h,
      campaigns24h
    ] = await Promise.all([
      // Users who had activity in last 24h (uploads, templates, campaigns, or contacts)
      prisma.users.count({
        where: {
          OR: [
            { uploads: { some: { created_at: { gte: yesterday } } } },
            { templates: { some: { created_at: { gte: yesterday } } } },
            { campaigns: { some: { created_at: { gte: yesterday } } } },
            { contacts: { some: { created_at: { gte: yesterday } } } }
          ]
        }
      }),
      // New users in last 24h
      prisma.users.count({
        where: { created_at: { gte: yesterday } }
      }),
      // New uploads in last 24h
      prisma.uploads.count({
        where: { created_at: { gte: yesterday } }
      }),
      // New campaigns in last 24h
      prisma.campaigns.count({
        where: { created_at: { gte: yesterday } }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      totalUploads,
      totalTemplates,
      totalCampaigns,
      totalContacts,
      totalEmailsSent,
      totalEmailsFailed,
      activeUsers24h,
      newUsers24h,
      uploads24h,
      campaigns24h
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
