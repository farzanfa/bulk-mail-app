# Email Delivery Diagnostic Scripts

These scripts help diagnose email delivery issues in your MailWeaver application.

## Scripts Available

### 1. `diagnose-email-delivery.ts`
Shows an overview of recent campaigns and their delivery statistics.

**Usage:**
```bash
npx tsx diagnostics/diagnose-email-delivery.ts
```

**What it shows:**
- Recent campaigns with recipient statistics
- Failed deliveries and error messages
- Gmail account status
- User plan and usage information

### 2. `email-delivery-report.ts`
Generates a detailed report for a specific campaign and exports recipient data.

**Usage:**
```bash
npx tsx diagnostics/email-delivery-report.ts <campaign-id>
```

**Example:**
```bash
npx tsx diagnostics/email-delivery-report.ts cmemilog00071kz04liyunkz3
```

**What it provides:**
- Detailed campaign statistics
- List of sent/failed recipients
- Error analysis
- CSV export of all recipients
- Recommendations for improving delivery

## Your Campaign Analysis

For your campaign "awsugkochi august meetup" with 122 recipients:
- **Campaign ID**: cmemilog00071kz04liyunkz3
- **Status**: All emails sent successfully (100%)
- **Issue**: Emails likely in spam folders due to:
  - Sending from personal Gmail account
  - Lack of email authentication (SPF/DKIM/DMARC)
  - Bulk sending triggers spam filters

## Quick Actions

1. **Check overall status:**
   ```bash
   npx tsx diagnostics/diagnose-email-delivery.ts
   ```

2. **Get detailed report for your campaign:**
   ```bash
   npx tsx diagnostics/email-delivery-report.ts cmemilog00071kz04liyunkz3
   ```

3. **Export recipient list:**
   The report script automatically creates a CSV file with all recipients.

## Recommendations

1. **Immediate**: Ask recipients to check spam/junk folders
2. **Future**: Use Google Workspace or professional email service
3. **Authentication**: Set up SPF, DKIM, DMARC for your domain