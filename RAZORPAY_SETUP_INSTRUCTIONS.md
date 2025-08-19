# Razorpay Setup Instructions

## Current Issue
Your API endpoint `/api/payment/razorpay/create-order` is returning a 500 error because Razorpay credentials are not configured.

## Step-by-Step Fix

### 1. Configure Razorpay Credentials

I've created a `.env.local` file with placeholders. You need to update it with your actual Razorpay credentials:

1. **Get Test Mode Credentials:**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
   - Navigate to Settings → API Keys
   - Generate Test Mode API keys
   - Copy the Key ID and Secret

2. **Update .env.local:**
   ```bash
   # Edit the file and replace the placeholders
   RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET_KEY
   ```

### 2. Create Subscription Plans in Razorpay

You need to create subscription plans in your Razorpay Dashboard:

1. Go to Products → Subscriptions → Plans
2. Create 6 plans total (monthly and yearly for each tier):
   
   **Starter Plans:**
   - Monthly: $9/month (₹750 approx)
   - Yearly: $90/year (₹7,500 approx)
   
   **Professional Plans:**
   - Monthly: $29/month (₹2,400 approx)
   - Yearly: $290/year (₹24,000 approx)
   
   **Enterprise Plans:**
   - Monthly: $99/month (₹8,200 approx)
   - Yearly: $990/year (₹82,000 approx)

3. After creating each plan, copy its Plan ID and update `.env.local`:
   ```bash
   RAZORPAY_PLAN_STARTER_MONTHLY=plan_YOUR_PLAN_ID
   RAZORPAY_PLAN_STARTER_YEARLY=plan_YOUR_PLAN_ID
   # ... and so on for all plans
   ```

### 3. Configure Database (if needed)

If you haven't set up your database connection:

1. Add your Neon PostgreSQL URL to `.env.local`:
   ```bash
   POSTGRES_URL=postgres://user:password@host/database?sslmode=require
   ```

2. The plans should already be seeded in your database with these IDs:
   - `starter_plan_id`
   - `professional_plan_id`
   - `enterprise_plan_id`

### 4. Test the Setup

After configuring:

1. **Restart your development server**
2. **Try the payment flow again**
3. **Check the server logs** for any error messages

### 5. Troubleshooting

If you still get errors:

1. **Check environment variables are loaded:**
   ```bash
   # In your terminal where you run the dev server
   echo $RAZORPAY_KEY_ID
   ```

2. **Verify the .env.local file is being read:**
   - Make sure the file is named exactly `.env.local`
   - Ensure it's in the root directory of your project

3. **Check server logs for specific errors:**
   - The API route has detailed logging
   - Look for messages starting with ❌ or 📝

### Common Issues

1. **"Payment gateway not configured"** - Missing Razorpay credentials
2. **"Plan not found"** - Database connection issue or plans not seeded
3. **"Plan configuration not found"** - Mismatch between plan types in database and code

### Need Help?

If you're still having issues after following these steps:
1. Check the server console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your database is connected and plans are seeded