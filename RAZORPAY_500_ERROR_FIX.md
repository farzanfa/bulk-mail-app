# Razorpay Create Order 500 Error Fix

## Issue Summary
The `/api/payment/razorpay/create-order` endpoint was returning a 500 Internal Server Error because the plan ID being sent from the frontend didn't exist in the production database.

## Root Cause
The production database was missing the subscription plans data, or the plan IDs in production were different from what the frontend was expecting.

## Solutions Implemented

### 1. Enhanced Error Handling in Create Order Endpoint
Updated `/app/api/payment/razorpay/create-order/route.ts` to:
- Provide better error messages when a plan is not found
- Add fallback logic to look up plans by type if ID lookup fails
- Log available plans in the database for debugging

### 2. Plan Type Fallback
The endpoint now supports:
- Primary lookup by plan ID
- Fallback lookup by plan type (free, starter, professional, enterprise)
- Intelligent extraction of plan type from malformed IDs

### 3. Database Initialization Endpoint
Created `/app/api/payment/razorpay/init-plans/route.ts` to:
- Seed the database with default plans
- Ensure consistent plan data across environments
- Protected with authorization header for security

## How to Fix in Production

### Option 1: Initialize Plans via API (Recommended)
```bash
# Set ADMIN_SECRET_KEY in Vercel environment variables first
curl -X POST https://mailweaver.farzanfa.com/api/payment/razorpay/init-plans \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET_KEY" \
  -H "Content-Type: application/json"
```

### Option 2: Use Prisma Seed
```bash
# SSH into your production environment or use Vercel CLI
npx prisma db seed
```

### Option 3: Manual Database Update
Use your database management tool to ensure the `plans` table contains the required plans with correct types.

## Verification Steps

1. Check available plans:
```bash
curl https://mailweaver.farzanfa.com/api/payment/razorpay/plans
```

2. Test the create-order endpoint:
```bash
curl -X POST https://mailweaver.farzanfa.com/api/payment/razorpay/create-order \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"planId":"ACTUAL_PLAN_ID","billingCycle":"monthly"}'
```

## Prevention
- Always run database migrations and seeds when deploying
- Add health check endpoints to verify critical data exists
- Implement proper error handling with meaningful messages
- Use type-safe lookups where possible