# Potential Issues Causing 500 Error

Since Razorpay was already configured but still throwing 500 errors, here are the most likely causes:

## 1. Currency Conversion API Timeout ⏱️
The error might occur when the currency conversion APIs are slow or failing:
- The endpoint calls `convertUSDtoINR()` which makes external API calls
- If these APIs timeout or fail, it could cause a 500 error
- The code has fallback logic, but the API calls might be blocking

## 2. Database Connection Issues 🗄️
Under load, the database connection might be timing out:
- The endpoint queries the plans table
- Creates/updates user_subscriptions
- Connection pool exhaustion could cause failures

## 3. Amount Calculation Issue 💰
There might be a double multiplication issue:
- Currency converter returns INR amount (e.g., 750 for $9)
- `createRazorpayOrder` multiplies by 100 again for paise
- This could result in amounts exceeding Razorpay's limits

## 4. Session/Authentication Problem 🔐
The error might be in session handling:
- `getServerSession` might be failing
- User ID extraction could be failing
- This would cause the endpoint to error out

## 5. Plan Configuration Mismatch 📋
The plan types in database might not match the code:
- Code expects plan types: 'starter', 'professional', 'enterprise'
- Database might have different values
- This causes `RAZORPAY_PLANS[plan.type]` to be undefined

## Debugging Steps:

1. **Check server logs** for the specific error message
2. **Add more logging** to identify exactly where it fails
3. **Test currency API** separately to ensure it's working
4. **Verify plan types** in database match the code
5. **Check request payload** - ensure planId and billingCycle are correct

## Quick Fix to Try:

Add error handling and logging to pinpoint the issue:

```typescript
// In create-order/route.ts
try {
  console.log('1. Starting create order...');
  // existing code...
  
  console.log('2. Currency conversion...');
  const inrAmount = await convertUSDtoINR(usdAmount);
  
  console.log('3. Creating Razorpay order...');
  const order = await createRazorpayOrder(...);
  
  // etc...
} catch (error) {
  console.error('Create order failed at step X:', error);
  throw error;
}
```