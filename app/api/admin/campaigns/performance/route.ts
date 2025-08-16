import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/db';

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get campaigns with performance metrics
    const campaigns = await prisma.campaigns.findMany({
      take: 50,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        recipients: {
          select: {
            status: true,
            attempts: true
          }
        }
      }
    });

    // Calculate performance metrics for each campaign
    const campaignsWithMetrics = campaigns.map(campaign => {
      const totalRecipients = campaign.recipients.length;
      const sent = campaign.recipients.filter(r => r.status === 'sent').length;
      const failed = campaign.recipients.filter(r => r.status === 'failed').length;
      const pending = campaign.recipients.filter(r => r.status === 'pending').length;
      
      // Calculate rates (mock data for now since we don't have open/click tracking)
      const bounceRate = totalRecipients > 0 ? (failed / totalRecipients) * 100 : 0;
      const avgOpenRate = totalRecipients > 0 ? Math.random() * 30 + 15 : 0; // Mock: 15-45%
      const avgClickRate = totalRecipients > 0 ? Math.random() * 5 + 2 : 0; // Mock: 2-7%
      
      // Mock opened and clicked counts based on rates
      const opened = Math.round((avgOpenRate / 100) * sent);
      const clicked = Math.round((avgClickRate / 100) * sent);

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        sent,
        failed,
        opened,
        clicked,
        bounceRate,
        avgOpenRate,
        avgClickRate,
        createdAt: campaign.created_at.toISOString()
      };
    });

    return NextResponse.json({ campaigns: campaignsWithMetrics });
  } catch (error) {
    console.error('Failed to fetch campaign performance:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign data' }, { status: 500 });
  }
}
