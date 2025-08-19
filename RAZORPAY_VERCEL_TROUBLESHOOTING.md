# Razorpay Vercel Deployment Troubleshooting

## Issue
The `/api/payment/razorpay/create-order` endpoint returns 500 error on Vercel but works locally.

## Root Causes & Solutions

### 1. Currency API Network Issues
**Problem**: Vercel's serverless functions may have network restrictions or timeouts when calling external currency APIs.

**Solution Implemented**:
- Added timeout handling (10 seconds) for currency conversion
- Implemented fallback rate (83.50 INR/USD) when APIs fail
- Enhanced error logging to identify network issues

### 2. Environment Variables Configuration
**Required Variables in Vercel**:
```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**Verification Steps**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Ensure both variables are set for Production environment
3. Redeploy after adding/updating variables

### 3. AbortSignal Compatibility
**Problem**: `AbortSignal.timeout()` may not be available in all Node.js versions on Vercel.

**Solution Implemented**:
- Replaced `AbortSignal.timeout()` with manual timeout handling using `setTimeout` and `AbortController`

### 4. Test the Deployment

Use the test endpoint to diagnose issues:
```bash
curl https://mailweaver.farzanfa.com/api/payment/razorpay/test
```

This will return:
- Environment variable presence
- Razorpay initialization status
- Currency API connectivity
- Database connection status

### 5. Vercel Function Configuration

Add to `vercel.json` if needed:
```json
{
  "functions": {
    "app/api/payment/razorpay/create-order/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 6. Error Monitoring

The updated endpoint now logs:
- Detailed error messages with context
- Environment variable status (without exposing values)
- Network request failures
- Timeout issues

### 7. Next Steps

1. **Deploy the changes** to Vercel
2. **Test the endpoint** using the test route first
3. **Monitor logs** in Vercel Functions logs
4. **Check network tab** in browser DevTools for detailed error responses

### 8. Common Vercel Issues

1. **Function Timeout**: Default is 10s for hobby plan, 60s for pro
2. **Cold Starts**: First request may be slower
3. **Environment Variables**: Must redeploy after adding new env vars
4. **Network Policies**: Some external APIs may be rate-limited or blocked

## Updated Files

1. `/app/api/payment/razorpay/create-order/route.ts` - Enhanced error handling and fallbacks
2. `/lib/currency-converter.ts` - Fixed timeout issues and added resilience
3. `/app/api/payment/razorpay/test/route.ts` - New diagnostic endpoint

## Verification Commands

```bash
# Test locally
curl http://localhost:3000/api/payment/razorpay/test

# Test on Vercel
curl https://mailweaver.farzanfa.com/api/payment/razorpay/test

# Check Vercel logs
vercel logs --follow
```