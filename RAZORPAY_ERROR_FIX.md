# Fix for Razorpay 500 Error

## Problem Identified
The `/api/payment/razorpay/create-order` endpoint is returning a 500 error because the required Razorpay environment variables are not configured.

## Root Cause
The application is missing the following environment variables:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Without these, the Razorpay SDK cannot be initialized, causing the API calls to fail.

## Solution Steps

### 1. Get Razorpay API Keys
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. Generate API keys if not already done
4. You'll receive:
   - **Key ID** (starts with `rzp_test_` for test mode or `rzp_live_` for live mode)
   - **Key Secret** (keep this secure!)

### 2. Configure Environment Variables

#### For Local Development:
Create a `.env.local` file in the project root:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here  # Optional but recommended
```

#### For Production (Vercel/Other Hosting):
Add these environment variables in your hosting platform:
- For Vercel: Go to Project Settings → Environment Variables
- Add the same variables with your production keys

### 3. Verify Configuration
After setting up the environment variables:

1. **For local development:**
   ```bash
   # Restart your development server
   npm run dev
   
   # Test the configuration
   node scripts/test-razorpay.js
   ```

2. **For production:**
   - Redeploy your application
   - The environment variables will be picked up automatically

### 4. Test the Payment Flow
Once configured:
1. Visit `/dashboard/billing`
2. Try to upgrade to a paid plan
3. The payment modal should now open successfully

## Important Notes

### Security Considerations:
- Never commit `.env.local` or any file containing API keys
- Use different API keys for development and production
- For production, use `rzp_live_` keys
- For development/testing, use `rzp_test_` keys

### Test Card Details:
For testing payments, use:
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

## Error Logs Analysis
From the logs, we can see:
- The endpoint was called at `Aug 18 13:54:40.93`
- It returned a 500 error
- The error occurs during the Razorpay order creation process
- The environment check in the code confirms missing configuration

## Prevention
To prevent this in the future:
1. Always check environment variables during deployment
2. Use the test script to verify configuration before going live
3. Set up monitoring for payment-related endpoints
4. Document all required environment variables in the README

## Additional Debugging
If the issue persists after configuration:
1. Check the server logs for detailed error messages
2. Verify the API keys are correct and not expired
3. Ensure you're using the correct mode (test/live) keys
4. Check if your Razorpay account is active and properly set up