# Razorpay Payment Integration Setup Guide

## Overview
This guide will help you set up Razorpay payment integration for the MailWeaver application.

## Prerequisites
1. A Razorpay account (Sign up at https://razorpay.com)
2. Access to the Razorpay Dashboard

## Setup Steps

### 1. Get Your API Keys
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. Generate API keys (if not already generated)
4. You'll get:
   - **Key ID** (starts with `rzp_test_` for test mode or `rzp_live_` for live mode)
   - **Key Secret** (keep this secure!)

### 2. Configure Environment Variables
Create a `.env.local` file in the project root (copy from `.env.example`):

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Set Up Webhooks (Optional but Recommended)
1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Set the webhook URL: `https://your-domain.com/api/webhooks/razorpay`
4. Select the following events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
5. Copy the webhook secret and add it to your `.env.local` file

### 4. Test Your Configuration
Run the test script to verify your setup:

```bash
node scripts/test-razorpay.js
```

This will:
- Check if all required environment variables are set
- Test the connection to Razorpay API
- Create a test order to verify your keys are working

## Troubleshooting

### Common Issues

#### 1. 500 Error on `/api/payment/razorpay/create-order`
**Possible Causes:**
- Missing or incorrect environment variables
- Invalid API keys
- Network connectivity issues

**Solution:**
1. Run `node scripts/test-razorpay.js` to diagnose
2. Check server logs for detailed error messages
3. Verify API keys in Razorpay Dashboard

#### 2. "Payment service not configured" Error
**Cause:** Environment variables are not set

**Solution:**
1. Ensure `.env.local` file exists with correct values
2. Restart your development server after adding environment variables
3. For production, ensure environment variables are set in your hosting platform

#### 3. "Invalid API Key" Error
**Cause:** Using test keys in production or vice versa

**Solution:**
- Use `rzp_test_` keys for development/testing
- Use `rzp_live_` keys for production
- Ensure the keys match your Razorpay account mode

## Security Best Practices
1. Never commit `.env.local` or any file containing API keys
2. Use different API keys for development and production
3. Regularly rotate your API keys
4. Always verify payment signatures on the server side
5. Implement proper error handling to avoid exposing sensitive information

## Testing Payments
For testing, use these [test card details](https://razorpay.com/docs/payments/payments/test-card-details/):
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: Not required for test cards

## Additional Resources
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Dashboard](https://dashboard.razorpay.com)