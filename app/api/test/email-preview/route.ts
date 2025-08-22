import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wrapEmailWithBranding } from '@/lib/email-template';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sample email content
  const sampleContent = `
    <h2 style="color: #111827; margin: 0 0 20px 0;">Hello {{firstName}}!</h2>
    <p style="margin: 0 0 16px 0;">Thank you for subscribing to our newsletter. We're excited to have you on board!</p>
    <p style="margin: 0 0 16px 0;">In this week's edition, we're covering:</p>
    <ul style="margin: 0 0 16px 0; padding-left: 20px;">
      <li style="margin: 0 0 8px 0;">Latest industry trends and insights</li>
      <li style="margin: 0 0 8px 0;">Exclusive tips from our experts</li>
      <li style="margin: 0 0 8px 0;">Special offers just for subscribers</li>
    </ul>
    <p style="margin: 0 0 24px 0;">Stay tuned for more amazing content coming your way!</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://example.com/read-more" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #9333ea, #2563eb); color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Read Full Newsletter</a>
    </div>
    <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br>The {{companyName}} Team</p>
  `;

  // Generate branded email with default branding
  const brandedEmail = wrapEmailWithBranding(sampleContent);

  // Also generate one with custom branding disabled (for premium users)
  const customBrandedEmail = wrapEmailWithBranding(sampleContent, {}, true);

  // Return HTML response
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Preview - MailWeaver</title>
      <style>
        body { margin: 0; padding: 20px; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #111827; margin-bottom: 10px; }
        .subtitle { color: #6b7280; margin-bottom: 30px; }
        .preview-section { margin-bottom: 40px; }
        .preview-title { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 10px; }
        .preview-frame { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        iframe { width: 100%; height: 800px; border: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Email Template Preview</h1>
        <p class="subtitle">Preview how your emails will look with MailWeaver branding</p>
        
        <div class="preview-section">
          <div class="preview-title">Standard Email (with MailWeaver branding)</div>
          <div class="preview-frame">
            <iframe srcdoc="${brandedEmail.replace(/"/g, '&quot;')}"></iframe>
          </div>
        </div>
        
        <div class="preview-section">
          <div class="preview-title">Premium Email (custom branding only)</div>
          <div class="preview-frame">
            <iframe srcdoc="${customBrandedEmail.replace(/"/g, '&quot;')}"></iframe>
          </div>
        </div>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}