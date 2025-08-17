import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as any).user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Get current month's start date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count emails sent this month
    const emailsSentThisMonth = await prisma.campaign_recipients.count({
      where: {
        campaign: {
          user_id: userId,
        },
        status: 'sent',
        created_at: {
          gte: startOfMonth,
        },
      },
    });

    // Count total contacts
    const contactsCount = await prisma.contacts.count({
      where: {
        user_id: userId,
      },
    });

    // Count total templates
    const templatesCount = await prisma.templates.count({
      where: {
        user_id: userId,
      },
    });

    // Count total campaigns
    const campaignsCount = await prisma.campaigns.count({
      where: {
        user_id: userId,
      },
    });

    return NextResponse.json({
      emails_sent_this_month: emailsSentThisMonth,
      contacts_count: contactsCount,
      templates_count: templatesCount,
      campaigns_count: campaignsCount,
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}