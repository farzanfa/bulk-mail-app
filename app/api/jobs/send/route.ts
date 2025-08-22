import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { kv } from '@/lib/kv';
import { tokenBucket, backoffDelayMs } from '@/lib/rateLimiter';
import { renderTemplateString } from '@/lib/render';
import { sendGmailMessage } from '@/lib/gmail';
import { createUnsubscribeToken, appendUnsubscribeFooter } from '@/lib/unsubscribe';
import { getBaseUrl } from '@/lib/baseUrl';
import { incrementEmailUsage } from '@/lib/email-usage';
import { getPlanLimits } from '@/lib/plan';
import { convertPlainHtmlToBranded } from '@/lib/email-template';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');
  const token = searchParams.get('token');
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 });

  const campaign = await prisma.campaigns.findUnique({ 
    where: { id: campaignId },
    include: { user: true }
  });
  if (!campaign || campaign.status !== 'running') return NextResponse.json({ ok: true });

  const template = await prisma.templates.findUnique({ where: { id: campaign.template_id } });
  const account = await prisma.google_accounts.findUnique({ where: { id: campaign.google_account_id } });
  if (!template || !account) return NextResponse.json({ error: 'Missing template/google account' }, { status: 400 });

  // Get plan limits to check for custom branding
  const planLimits = await getPlanLimits(campaign.user_id);
  const hasCustomBranding = planLimits.customBranding;

  const cursorKey = `camp:${campaignId}:cursor`;
  const cursor = await kv.get<{ lastId: string | null }>(cursorKey);
  const lastId = cursor?.lastId ?? null;

  const recipients = await prisma.campaign_recipients.findMany({
    where: {
      campaign_id: campaignId,
      status: 'pending',
      ...(lastId ? { id: { gt: lastId } } : {})
    },
    orderBy: { id: 'asc' },
    take: campaign.batch_size
  });

  if (recipients.length === 0) {
    await prisma.campaigns.update({ where: { id: campaignId }, data: { status: 'completed', completed_at: new Date() } });
    return NextResponse.json({ done: true });
  }

  for (const r of recipients) {
    const contact = await prisma.contacts.findUnique({ where: { id: r.contact_id } });
    if (!contact || contact.unsubscribed) {
      await prisma.campaign_recipients.update({ where: { id: r.id }, data: { status: 'skipped' } });
      continue;
    }
    const idempotentKey = `sent:${campaignId}:${contact.id}:${template.version}`;
    const already = await kv.get(idempotentKey);
    if (already) {
      await prisma.campaign_recipients.update({ where: { id: r.id }, data: { status: 'skipped' } });
      continue;
    }

    const allowed = await tokenBucket({ key: `${campaign.user_id}`, limitPerMinute: campaign.per_minute_limit });
    if (!allowed) {
      break; // stop this batch; next cron will resume
    }

    const subject = renderTemplateString(template.subject, contact.fields as any);
    let html = renderTemplateString(template.html, contact.fields as any);
    let text = renderTemplateString(template.text, contact.fields as any);
    
    // Apply branding to HTML email
    html = convertPlainHtmlToBranded(html, {}, hasCustomBranding);
    
    const token = createUnsubscribeToken(campaign.user_id, contact.id);
    const link = `${getBaseUrl(req.url)}/u/${token}`;
    html = appendUnsubscribeFooter(html, link, hasCustomBranding);
    text = text + `\n\nTo unsubscribe, visit: ${link}`;
    
    if (!hasCustomBranding) {
      text = text + `\n\nSent with MailWeaver - Professional Email Campaigns`;
    }

    let attempts = r.attempts;
    let sentId: string | null = null;
    while (attempts < 5) {
      try {
        sentId = await sendGmailMessage({
          refreshTokenEncrypted: account.refresh_token_encrypted,
          fromEmail: account.email,
          fromName: account.google_name || campaign.user.full_name || undefined,
          toEmail: contact.email,
          subject,
          html,
          text
        });
        await prisma.campaign_recipients.update({ where: { id: r.id }, data: { status: 'sent', gmail_message_id: sentId, rendered_subject: subject, rendered_html: html, rendered_text: text, attempts: attempts + 1, last_attempt_at: new Date() } });
        await kv.set(idempotentKey, true, { ex: 60 * 60 * 24 * 30 });
        
        // Track email usage
        await incrementEmailUsage(campaign.user_id, 1);
        
        break;
      } catch (err: any) {
        attempts += 1;
        const msg = typeof err?.message === 'string' ? err.message : 'send failed';
        const retriable = /rate|429|quota|temporarily|timeout|ECONNRESET|ETIMEDOUT|503|500/i.test(msg);
        if (attempts >= 5 || !retriable) {
          await prisma.campaign_recipients.update({ where: { id: r.id }, data: { status: 'failed', error: msg, attempts, last_attempt_at: new Date() } });
          break;
        }
        const delay = backoffDelayMs(attempts);
        await new Promise(res => setTimeout(res, delay));
      }
    }
    await kv.set(cursorKey, { lastId: r.id });
  }

  return NextResponse.json({ ok: true, processed: recipients.length });
}


