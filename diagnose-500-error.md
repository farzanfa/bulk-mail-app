# Diagnosing the 500 Error on /api/payment/razorpay/create-order

## Most Likely Causes (in order of probability):

### 1. **Currency Conversion API Failure** 🌐
The endpoint makes external API calls to convert USD to INR. These might be:
- Timing out under load
- Blocked by network/firewall
- Rate limited

**Quick Test:**
```bash
curl -s https://api.exchangerate-api.com/v4/latest/USD | jq .rates.INR
```

### 2. **Request Body Issues** 📦
The endpoint expects:
```json
{
  "planId": "starter_plan_id",  // Must match database plan IDs
  "billingCycle": "monthly"      // Must be "monthly" or "yearly"
}
```

Common issues:
- Missing or invalid planId
- Wrong billingCycle value
- Request not being parsed as JSON

### 3. **Session/Authentication** 🔐
The error might occur if:
- User is not authenticated
- Session data is missing user.id
- NextAuth configuration issue

### 4. **Database Connection Under Load** 🗄️
- Connection pool exhaustion
- Timeout on queries
- Prisma client not properly initialized

## Immediate Actions:

1. **Check Application Logs**
   Look for error messages around the timestamp of the 500 error

2. **Verify Request Payload**
   Ensure the frontend is sending correct data:
   - Check browser DevTools Network tab
   - Look at the request body being sent

3. **Test Currency API Directly**
   The currency converter might be the bottleneck

4. **Add Detailed Logging**
   Temporarily add console.log at each step to identify where it fails

## The Fix:

Based on the error occurring after configuration, it's most likely the **currency conversion API failing**. The code tries to fetch live exchange rates which might be:
- Blocked in production
- Taking too long and timing out
- Rate limited after multiple requests

**Temporary Solution:**
Use a fixed exchange rate instead of live API calls during peak times.