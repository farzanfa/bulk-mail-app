import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseCampaignDelivery() {
  try {
    // Get the most recent campaign
    const recentCampaigns = await prisma.campaigns.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            full_name: true
          }
        }
      }
    });

    console.log('\n=== Recent Campaigns ===');
    for (const campaign of recentCampaigns) {
      console.log(`\nCampaign: ${campaign.name}`);
      console.log(`ID: ${campaign.id}`);
      console.log(`Status: ${campaign.status}`);
      console.log(`Created: ${campaign.created_at}`);
      console.log(`Started: ${campaign.started_at || 'Not started'}`);
      console.log(`Completed: ${campaign.completed_at || 'Not completed'}`);
      console.log(`User: ${campaign.user.email}`);

      // Get recipient statistics
      const totalRecipients = await prisma.campaign_recipients.count({
        where: { campaign_id: campaign.id }
      });

      const sentCount = await prisma.campaign_recipients.count({
        where: { campaign_id: campaign.id, status: 'sent' }
      });

      const failedCount = await prisma.campaign_recipients.count({
        where: { campaign_id: campaign.id, status: 'failed' }
      });

      const pendingCount = await prisma.campaign_recipients.count({
        where: { campaign_id: campaign.id, status: 'pending' }
      });

      const skippedCount = await prisma.campaign_recipients.count({
        where: { campaign_id: campaign.id, status: 'skipped' }
      });

      console.log(`\nRecipient Statistics:`);
      console.log(`Total Recipients: ${totalRecipients}`);
      console.log(`Sent: ${sentCount} (${((sentCount/totalRecipients)*100).toFixed(1)}%)`);
      console.log(`Failed: ${failedCount} (${((failedCount/totalRecipients)*100).toFixed(1)}%)`);
      console.log(`Pending: ${pendingCount} (${((pendingCount/totalRecipients)*100).toFixed(1)}%)`);
      console.log(`Skipped: ${skippedCount} (${((skippedCount/totalRecipients)*100).toFixed(1)}%)`);

      // If there are failed recipients, show error details
      if (failedCount > 0) {
        const failedRecipients = await prisma.campaign_recipients.findMany({
          where: { campaign_id: campaign.id, status: 'failed' },
          take: 10,
          include: {
            contact: {
              select: {
                email: true
              }
            }
          }
        });

        console.log(`\nFailed Recipients (showing first 10):`);
        const errorCounts = new Map<string, number>();
        
        for (const recipient of failedRecipients) {
          console.log(`- ${recipient.contact.email}: ${recipient.error || 'No error message'}`);
          
          // Count error types
          const errorType = recipient.error || 'Unknown error';
          errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
        }

        // Show all failed recipients to get error type distribution
        const allFailedRecipients = await prisma.campaign_recipients.findMany({
          where: { campaign_id: campaign.id, status: 'failed' },
          select: { error: true }
        });

        const allErrorCounts = new Map<string, number>();
        for (const recipient of allFailedRecipients) {
          const errorType = recipient.error || 'Unknown error';
          allErrorCounts.set(errorType, (allErrorCounts.get(errorType) || 0) + 1);
        }

        console.log(`\nError Distribution:`);
        for (const [error, count] of allErrorCounts) {
          console.log(`- ${error}: ${count} occurrences`);
        }
      }

      // Check rate limiting and quotas
      console.log(`\nCampaign Settings:`);
      console.log(`Batch Size: ${campaign.batch_size}`);
      console.log(`Per Minute Limit: ${campaign.per_minute_limit}`);

      // Check if campaign has 122 recipients (as mentioned by user)
      if (totalRecipients === 122) {
        console.log(`\n⚠️  This appears to be the campaign you mentioned with 122 recipients!`);
      }
    }

    // Check Gmail account status
    console.log('\n\n=== Gmail Account Status ===');
    const googleAccounts = await prisma.google_accounts.findMany({
      select: {
        id: true,
        email: true,
        google_name: true,
        created_at: true
      }
    });

    for (const account of googleAccounts) {
      console.log(`\nAccount: ${account.email}`);
      console.log(`Name: ${account.google_name || 'Not set'}`);
      console.log(`Connected: ${account.created_at}`);
    }

    // Check user's email usage and plan
    if (recentCampaigns.length > 0) {
      const userId = recentCampaigns[0].user_id;
      
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          subscription: {
            include: {
              plan: true
            }
          }
        }
      });

      if (user && user.subscription) {
        console.log('\n\n=== User Plan & Usage ===');
        console.log(`Current Plan: ${user.subscription.plan.name}`);
        console.log(`Email Limit: ${user.subscription.plan.emails_per_month === -1 ? 'Unlimited' : user.subscription.plan.emails_per_month} per month`);
        console.log(`Plan Status: ${user.subscription.status}`);
        
        // Get email usage for current month
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const emailUsage = await prisma.email_usage.aggregate({
          where: {
            user_id: userId,
            created_at: {
              gte: currentMonth
            }
          },
          _sum: {
            emails_sent: true
          }
        });
        
        console.log(`Emails Sent This Month: ${emailUsage._sum.emails_sent || 0}`);
      }
    }

  } catch (error) {
    console.error('Error running diagnostics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnosis
diagnoseCampaignDelivery();