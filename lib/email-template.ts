export interface BrandingConfig {
  logoUrl?: string;
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  websiteUrl?: string;
  showPoweredBy?: boolean;
}

const defaultBranding: BrandingConfig = {
  logoUrl: '/email-logo.png',
  companyName: 'MailWeaver',
  primaryColor: '#9333ea', // Purple
  secondaryColor: '#2563eb', // Blue
  websiteUrl: 'https://mailweaver.farzanfa.com',
  showPoweredBy: true
};

export function wrapEmailWithBranding(
  content: string, 
  branding: BrandingConfig = {},
  hasCustomBranding: boolean = false
): string {
  const config = { ...defaultBranding, ...branding };
  const showBranding = !hasCustomBranding || config.showPoweredBy;
  
  // Use absolute URL for logo
  const logoUrl = config.logoUrl?.startsWith('http') 
    ? config.logoUrl 
    : `${config.websiteUrl}${config.logoUrl}`;
  
  // High DPI logo for retina displays
  const logoUrl2x = logoUrl.replace(/\.(png|jpg|jpeg)$/i, '@2x.$1');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email from ${config.companyName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .header-logo { width: 150px !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${showBranding ? `
                <a href="${config.websiteUrl}" style="text-decoration: none;">
                  <img src="${logoUrl}" srcset="${logoUrl} 1x, ${logoUrl2x} 2x" alt="${config.companyName}" class="header-logo" style="width: 180px; height: 180px; max-width: 100%; display: block; margin: 0 auto;">
                </a>
              ` : ''}
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="color: #111827; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          ${showBranding ? `
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center; background-color: #f9fafb;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <div style="background: linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor}); padding: 2px; border-radius: 6px; display: inline-block; margin-bottom: 15px;">
                      <div style="background: white; padding: 8px 16px; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; font-weight: 600;">
                          Sent with <a href="${config.websiteUrl}" style="color: ${config.primaryColor}; text-decoration: none;">${config.companyName}</a>
                        </p>
                      </div>
                    </div>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                      Professional Email Campaigns Made Simple
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
        </table>
        
        <!-- Additional footer info -->
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 0 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} ${config.companyName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function convertPlainHtmlToBranded(
  html: string,
  branding: BrandingConfig = {},
  hasCustomBranding: boolean = false
): string {
  // If the HTML already has DOCTYPE, it's likely already a full HTML document
  if (html.trim().toLowerCase().startsWith('<!doctype')) {
    return html;
  }
  
  // If it's just content, wrap it with branding
  return wrapEmailWithBranding(html, branding, hasCustomBranding);
}