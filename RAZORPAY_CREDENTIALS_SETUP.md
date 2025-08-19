# Razorpay Credentials Setup Guide

## ✅ Current Status
Your Razorpay credentials have been successfully configured in the `.env` file and are working correctly.

## 🔒 Security Best Practices

### Local Development
- The `.env` file contains your credentials and is properly gitignored
- Never commit the `.env` file to version control
- Use `.env.example` as a template for other developers

### Production Deployment (Vercel)

Add these environment variables to your Vercel project:

```bash
# Go to your Vercel project settings > Environment Variables
# Add each of these:

RAZORPAY_KEY_ID=rzp_live_R6jcf0rQXIBf7s
RAZORPAY_KEY_SECRET=NmfRxM4znJF1WVONLZ1epZjb
RAZORPAY_WEBHOOK_SECRET=FXJ!T7cPN2gR-x6
RAZORPAY_PLAN_STARTER_MONTHLY=plan_R756ULe2ADKrAK
RAZORPAY_PLAN_STARTER_YEARLY=plan_R75C5I1wMcFKWJ
RAZORPAY_PLAN_PROFESSIONAL_MONTHLY=plan_R75ENZQF1ZP3fk
RAZORPAY_PLAN_PROFESSIONAL_YEARLY=plan_R75Euuno76irUT
RAZORPAY_PLAN_ENTERPRISE_MONTHLY=plan_R75FKqSLzCEm5D
RAZORPAY_PLAN_ENTERPRISE_YEARLY=plan_R75FVzznhMhvVA
```

### Using Vercel CLI
```bash
vercel env add RAZORPAY_KEY_ID production
vercel env add RAZORPAY_KEY_SECRET production
vercel env add RAZORPAY_WEBHOOK_SECRET production
# ... repeat for all plan IDs
```

## 🚨 Important Security Notes

1. **These are LIVE credentials** (notice the `rzp_live_` prefix)
   - Be extremely careful with them
   - Any transactions will be real and charge actual money
   - Consider using test mode credentials for development

2. **Webhook Setup**
   - Configure your webhook endpoint in Razorpay Dashboard
   - Set the webhook URL to: `https://yourdomain.com/api/payment/razorpay/webhook`
   - Use the webhook secret provided above

3. **Monitor Your Account**
   - Regularly check your Razorpay dashboard
   - Set up alerts for unusual activity
   - Enable 2FA on your Razorpay account

## 🧪 Testing the Setup

1. **Local Testing**
   ```bash
   npx tsx scripts/test-razorpay-setup.ts
   ```

2. **API Endpoint Testing**
   ```bash
   curl http://localhost:3000/api/payment/test-setup
   ```

3. **Full Integration Test**
   - Start your development server: `npm run dev`
   - Navigate to your pricing page
   - Try initiating a subscription

## 📝 Troubleshooting

If you encounter issues:

1. **Check Environment Variables**
   - Ensure all variables are set correctly
   - No extra spaces or quotes in values
   - Restart your development server after changes

2. **Verify Plan IDs**
   - Login to Razorpay Dashboard
   - Navigate to Subscriptions > Plans
   - Verify all plan IDs match

3. **Test vs Live Mode**
   - For development, consider using test mode credentials
   - Test credentials start with `rzp_test_`
   - Live credentials start with `rzp_live_`

## 🔄 Credential Rotation

For security, rotate your credentials periodically:

1. Generate new API keys in Razorpay Dashboard
2. Update `.env` locally
3. Update Vercel environment variables
4. Deploy the changes

Remember: Never share these credentials publicly or commit them to version control!