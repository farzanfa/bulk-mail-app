# Beta User Setup Guide

This guide explains how beta users work in the application and how to configure them.

## What are Beta Users?

Beta users are special users who have unlimited access to all features without needing a paid subscription. This is useful for:
- Early testers and feedback providers
- Strategic partners
- Special promotions
- Internal testing

## Features for Beta Users

Beta users automatically get:
- **Unlimited Templates**: No restrictions on the number of email templates
- **Unlimited Uploads**: No restrictions on contact list uploads
- **Unlimited Contacts**: No limit on the number of contacts
- **Unlimited Emails**: No monthly email sending limits
- **Unlimited Campaigns**: No restrictions on the number of campaigns
- **Unlimited Team Members**: Can invite unlimited team members
- **Custom Branding**: Emails sent without platform branding
- **Priority Support**: Access to priority support channels
- **API Access**: Full API access for integrations
- **Advanced Analytics**: Access to all analytics features
- **Multiple Gmail Accounts**: Can connect unlimited Gmail accounts

## How to Configure Beta Users

Beta users are identified by their email addresses. To configure beta users:

1. Set the `BETA_EMAILS` environment variable with a comma-separated list of email addresses:

```bash
BETA_EMAILS="user1@example.com,user2@example.com,beta.tester@company.com"
```

2. Add this to your `.env` file (for local development) or your deployment environment variables (for production).

3. Email comparison is case-insensitive, so `USER@EXAMPLE.COM` and `user@example.com` are treated the same.

## Implementation Details

The beta user system is implemented in `/lib/plan.ts`:

1. The `isBetaEmail()` function checks if an email is in the beta list
2. The `getUserPlan()` function returns 'beta' for beta users
3. The `getPlanLimits()` function returns unlimited values (-1) for all limits
4. The `canConnectGmailAccount()` function always returns true for beta users

## Verifying Beta User Access

To verify a user has beta access:

1. Check their plan type in the UI - beta users will see a "Beta" badge
2. Check their plan limits - all limits should show as "Unlimited"
3. Run the test script: `npx tsx scripts/test-beta-user-logic.ts`

## Security Considerations

- Keep the `BETA_EMAILS` list secure and only add trusted users
- Regularly review and update the beta user list
- Consider implementing expiration dates for beta access in the future
- Monitor beta user usage to prevent abuse

## Removing Beta Access

To remove beta access from a user, simply remove their email from the `BETA_EMAILS` environment variable and restart the application.