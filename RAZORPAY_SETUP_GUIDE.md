# Razorpay Dashboard Configuration Guide

## 1. Create Razorpay Account
- Sign up at [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
- Complete KYC verification (for production use)

## 2. Get API Keys
1. Navigate to **Settings** → **API Keys**
2. Generate test mode keys:
   - **Key ID**: `rzp_test_XXXXXXXXXXXX`
   - **Key Secret**: Shows only once, save it securely
3. Add to your `.env` file:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY
   ```

## 3. Create Subscription Plans

### Navigate to Products → Subscriptions → Plans

Create these 4 plans:

### Plan 1: Starter Plan
- **Plan Name**: Starter Plan
- **Plan ID**: starter_monthly (or auto-generated)
- **Amount**: ₹2,400 (monthly)
- **Currency**: INR
- **Period**: Monthly
- **Description**: 5,000 emails/month, 2,500 contacts

### Plan 2: Starter Plan (Yearly)
- **Plan Name**: Starter Plan - Yearly
- **Plan ID**: starter_yearly
- **Amount**: ₹24,000 (yearly)
- **Currency**: INR
- **Period**: Yearly
- **Description**: 5,000 emails/month, 2,500 contacts (Save 17%)

### Plan 3: Professional Plan
- **Plan Name**: Professional Plan
- **Plan ID**: professional_monthly
- **Amount**: ₹6,200 (monthly)
- **Currency**: INR
- **Period**: Monthly
- **Description**: 25,000 emails/month, 10,000 contacts, Priority support

### Plan 4: Professional Plan (Yearly)
- **Plan Name**: Professional Plan - Yearly
- **Plan ID**: professional_yearly
- **Amount**: ₹62,000 (yearly)
- **Currency**: INR
- **Period**: Yearly
- **Description**: 25,000 emails/month, 10,000 contacts (Save 17%)

### Plan 5: Enterprise Plan
- **Plan Name**: Enterprise Plan
- **Plan ID**: enterprise_monthly
- **Amount**: ₹8,300 (monthly)
- **Currency**: INR
- **Period**: Monthly
- **Description**: 100,000 emails/month, 50,000 contacts, API access

### Plan 6: Enterprise Plan (Yearly)
- **Plan Name**: Enterprise Plan - Yearly
- **Plan ID**: enterprise_yearly
- **Amount**: ₹83,000 (yearly)
- **Currency**: INR
- **Period**: Yearly
- **Description**: 100,000 emails/month, 50,000 contacts (Save 17%)

## 4. Configure Webhooks

1. Navigate to **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Configure:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/razorpay`
   - **Secret**: Generate and save (add to `RAZORPAY_WEBHOOK_SECRET` in `.env`)
   - **Active Events**: Select these events:
     - ✅ payment.captured
     - ✅ payment.failed
     - ✅ subscription.activated
     - ✅ subscription.updated
     - ✅ subscription.cancelled
     - ✅ subscription.completed
     - ✅ subscription.charged
     - ✅ subscription.halted

## 5. Update Environment Variables

After creating plans, update your `.env`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# Razorpay Plan IDs (use the IDs from your dashboard)
RAZORPAY_PLAN_STARTER_MONTHLY=plan_XXXXXXXXXXXX
RAZORPAY_PLAN_STARTER_YEARLY=plan_XXXXXXXXXXXX
RAZORPAY_PLAN_PROFESSIONAL_MONTHLY=plan_XXXXXXXXXXXX
RAZORPAY_PLAN_PROFESSIONAL_YEARLY=plan_XXXXXXXXXXXX
RAZORPAY_PLAN_ENTERPRISE_MONTHLY=plan_XXXXXXXXXXXX
RAZORPAY_PLAN_ENTERPRISE_YEARLY=plan_XXXXXXXXXXXX
```

## 6. Test Mode Configuration

For testing:
- Use test mode API keys (prefix: `rzp_test_`)
- Test cards: 
  - Success: `4111 1111 1111 1111`
  - Failure: `5105 1051 0510 5100`
- Test UPI: `success@razorpay`
- CVV: Any 3 digits
- Expiry: Any future date

## 7. Payment Settings (Optional)

Navigate to **Settings** → **Configuration**:
- **Payment Methods**: Enable/disable specific methods
- **International Payments**: Enable if needed
- **Payment Capture**: Set to automatic
- **Checkout Theme**: Customize colors to match your brand

## 8. Business Settings

Complete these for production:
- **Business Details**: Add GST, PAN details
- **Bank Account**: Add for settlements
- **Terms & Conditions**: Add your T&C URL
- **Privacy Policy**: Add your privacy policy URL

## 9. Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Validate webhook signatures** (already implemented in code)
4. **Use test mode** for development
5. **Enable 2FA** on your Razorpay account

## Testing the Integration

1. Start your application
2. Navigate to `/billing`
3. Click "Upgrade" on any plan
4. Use test credentials to complete payment
5. Check webhook logs in Razorpay dashboard

## Notes

- Currency conversion: $29 ≈ ₹2,400 (at ~₹83/USD)
- Adjust prices based on your target market
- Free plan doesn't need Razorpay plan (handled internally)
- Consider offering trial periods for premium plans