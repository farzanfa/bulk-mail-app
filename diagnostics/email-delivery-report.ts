import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateDeliveryReport(campaignId: string) {
  try {
    // Get campaign details
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
      include: {
        user: {
          select: {
            email: true,
            full_name: true
          }
        },
        google_account: {
          select: {
            email: true,
            google_name: true
          }
        },
        template: {
          select: {
            name: true,
            subject: true
          }
        }
      }
    });

    if (!campaign) {
      console.log('Campaign not found!');
      return;
    }

    console.log('\n=== CAMPAIGN DELIVERY REPORT ===');
    console.log(`Campaign: ${campaign.name}`);
    console.log(`Status: ${campaign.status}`);
    console.log(`Started: ${campaign.started_at}`);
    console.log(`Completed: ${campaign.completed_at || 'Not completed'}`);
    console.log(`\nSent from: ${campaign.google_account.email}`);
    console.log(`Template: ${campaign.template.name}`);
    console.log(`Subject: ${campaign.template.subject}`);

    // Get all recipients with contact details
    const recipients = await prisma.campaign_recipients.findMany({
      where: { campaign_id: campaignId },
      include: {
        contact: {
          select: {
            email: true,
            fields: true,
            unsubscribed: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Count by status
    const statusCounts = recipients.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n=== DELIVERY STATISTICS ===');
    console.log(`Total Recipients: ${recipients.length}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count} (${((count/recipients.length)*100).toFixed(1)}%)`);
    });

    // Show sent recipients (first 10)
    const sentRecipients = recipients.filter(r => r.status === 'sent');
    if (sentRecipients.length > 0) {
      console.log('\n=== SUCCESSFULLY SENT TO (first 10) ===');
      sentRecipients.slice(0, 10).forEach(r => {
        console.log(`✓ ${r.contact.email} - Sent at: ${r.last_attempt_at || r.created_at}`);
      });
      if (sentRecipients.length > 10) {
        console.log(`... and ${sentRecipients.length - 10} more recipients`);
      }
    }

    // Show failed recipients (all of them)
    const failedRecipients = recipients.filter(r => r.status === 'failed');
    if (failedRecipients.length > 0) {
      console.log('\n=== FAILED DELIVERIES ===');
      failedRecipients.forEach(r => {
        console.log(`✗ ${r.contact.email} - Error: ${r.error || 'Unknown error'}`);
      });
    }

    // Check for potential issues
    console.log('\n=== POTENTIAL ISSUES & RECOMMENDATIONS ===');
    
    // Check if all emails were sent successfully
    if (statusCounts.sent === recipients.length) {
      console.log('✓ All emails were sent successfully!');
      console.log('\nHowever, successful sending doesn\'t guarantee inbox delivery. Recipients may not have received emails due to:');
      console.log('1. Emails landing in spam/junk folder');
      console.log('2. Email server rejecting the message silently');
      console.log('3. Invalid or inactive email addresses');
      console.log('4. Aggressive spam filters');
    }

    // Check sending rate
    if (campaign.started_at && campaign.completed_at) {
      const durationMs = new Date(campaign.completed_at).getTime() - new Date(campaign.started_at).getTime();
      const durationMinutes = durationMs / 1000 / 60;
      const emailsPerMinute = recipients.length / durationMinutes;
      console.log(`\nSending rate: ${emailsPerMinute.toFixed(1)} emails/minute`);
      if (emailsPerMinute > 50) {
        console.log('⚠️  High sending rate detected. Consider reducing to avoid spam filters.');
      }
    }

    // Export recipient list for verification
    console.log('\n=== EXPORTING RECIPIENT LIST ===');
    const csvContent = [
      'Email,Status,Sent At,Error',
      ...recipients.map(r => 
        `${r.contact.email},${r.status},"${r.last_attempt_at || r.created_at || ''}","${r.error || ''}"`
      )
    ].join('\n');
    
    const fs = await import('fs/promises');
    const filename = `campaign-${campaignId}-recipients.csv`;
    await fs.writeFile(filename, csvContent);
    console.log(`Recipient list exported to: ${filename}`);

  } catch (error) {
    console.error('Error generating report:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if campaign ID was provided
const campaignId = process.argv[2];
if (!campaignId) {
  console.log('Usage: npx tsx scripts/email-delivery-report.ts <campaign-id>');
  console.log('\nRecent campaigns:');
  console.log('- cmemilog00071kz04liyunkz3 (awsugkochi august meetup - 122 recipients)');
  process.exit(1);
}

generateDeliveryReport(campaignId);