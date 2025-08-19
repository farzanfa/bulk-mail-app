# Fixing the Razorpay 500 Error

## Problem
The error "POST https://mailweaver.farzanfa.com/api/payment/razorpay/create-order 500 (Internal Server Error)" is occurring because the Razorpay environment variables are not configured.

## Solution

### 1. Configure Environment Variables

I've created a `.env` file with placeholders. You need to:

1. **Get Razorpay API Keys:**
   - Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
   - Go to Settings → API Keys
   - Generate test mode keys for development
   - Copy the Key ID and Secret

2. **Update the .env file:**
   ```bash
   # Replace these with your actual values
   RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY
   ```

3. **Create Subscription Plans in Razorpay:**
   - Follow the instructions in `RAZORPAY_SETUP_GUIDE.md`
   - Create all 6 plans (monthly and yearly for each tier)
   - Update the plan IDs in your .env file

### 2. Verify Database Setup

Run the seed script to ensure plans exist in your database:
```bash
npm run db:seed-plans
# or
npx tsx scripts/seed-plans.ts
```

### 3. Test the Integration

After setting up:
1. Restart your development server
2. Try upgrading to a plan
3. Check the console logs for detailed error messages

## What I've Done

1. **Added better error handling** to the create-order route that checks for missing environment variables
2. **Added detailed logging** to help debug issues
3. **Created a .env file** with all required variables (you need to fill in the values)

## Common Issues

1. **Missing Razorpay credentials**: The most common cause of this error
2. **Invalid plan IDs**: Make sure the plan IDs in .env match those in your Razorpay dashboard
3. **Database connection issues**: Ensure your POSTGRES_URL is correct
4. **Currency API failures**: The app will fall back to a default rate if APIs fail

## Next Steps

1. Fill in the `.env` file with your actual credentials
2. Create the subscription plans in Razorpay
3. Test the payment flow in development mode

For detailed setup instructions, refer to `RAZORPAY_SETUP_GUIDE.md`.