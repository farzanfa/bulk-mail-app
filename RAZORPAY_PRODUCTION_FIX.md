# Razorpay Production Configuration Fix

## Issue
The `/api/payment/razorpay/create-order` endpoint is returning a 500 error on production (`mailweaver.farzanfa.com`) because the Razorpay environment variables are not configured in the production environment.

## Root Cause
The environment variables we added to the `.env` file are only available in local development. Production environments need these variables configured separately.

## Solution

### For Vercel Deployment
If deployed on Vercel:
1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:
   - `RAZORPAY_KEY_ID` = `rzp_live_R6jcf0rQXIBf7s`
   - `RAZORPAY_KEY_SECRET` = `NmfRxM4znJF1WVONLZ1epZjb`
   - `RAZORPAY_WEBHOOK_SECRET` = `FXJ!T7cPN2gR-x6`
5. Redeploy the application

### For Other Hosting Providers

#### Option 1: Using a `.env.production` file
Create a `.env.production` file on your server with:
```
RAZORPAY_KEY_ID=rzp_live_R6jcf0rQXIBf7s
RAZORPAY_KEY_SECRET=NmfRxM4znJF1WVONLZ1epZjb
RAZORPAY_WEBHOOK_SECRET=FXJ!T7cPN2gR-x6
```

#### Option 2: System Environment Variables
Set system environment variables on your server:
```bash
export RAZORPAY_KEY_ID="rzp_live_R6jcf0rQXIBf7s"
export RAZORPAY_KEY_SECRET="NmfRxM4znJF1WVONLZ1epZjb"
export RAZORPAY_WEBHOOK_SECRET="FXJ!T7cPN2gR-x6"
```

#### Option 3: PM2 Ecosystem File
If using PM2, add to your ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'mailweaver',
    script: 'npm',
    args: 'start',
    env: {
      RAZORPAY_KEY_ID: 'rzp_live_R6jcf0rQXIBf7s',
      RAZORPAY_KEY_SECRET: 'NmfRxM4znJF1WVONLZ1epZjb',
      RAZORPAY_WEBHOOK_SECRET: 'FXJ!T7cPN2gR-x6',
    }
  }]
}
```

#### Option 4: Docker Environment
If using Docker, add to your docker-compose.yml or Dockerfile:
```yaml
environment:
  - RAZORPAY_KEY_ID=rzp_live_R6jcf0rQXIBf7s
  - RAZORPAY_KEY_SECRET=NmfRxM4znJF1WVONLZ1epZjb
  - RAZORPAY_WEBHOOK_SECRET=FXJ!T7cPN2gR-x6
```

## Verification Steps

After setting the environment variables:

1. **Restart your application**
   ```bash
   # For PM2
   pm2 restart all
   
   # For systemd
   sudo systemctl restart your-app
   
   # For Docker
   docker-compose restart
   ```

2. **Test the health endpoint**
   ```bash
   curl https://mailweaver.farzanfa.com/api/payment/razorpay/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "razorpayConfig": {
       "keyIdConfigured": true,
       "keySecretConfigured": true,
       "webhookSecretConfigured": true,
       "keyIdPrefix": "rzp_live...",
       "mode": "live"
     }
   }
   ```

3. **Test create-order endpoint**
   The 500 error should be resolved once environment variables are properly configured.

## Security Note
⚠️ **IMPORTANT**: You're using LIVE Razorpay credentials. Ensure:
- Environment variables are kept secure
- Access to production server is restricted
- Consider using separate test credentials for staging environments
- Enable webhook signature verification for security

## Additional Debugging

If the issue persists after setting environment variables:

1. Check application logs for specific error messages
2. Verify the application can read environment variables:
   - Add a test endpoint to check `process.env`
   - Check if your hosting provider requires a specific method to set env vars
3. Ensure the application was properly restarted after adding variables
4. Check if there are any build-time vs runtime environment variable issues

## Contact Support
If you continue to experience issues, check with your hosting provider's documentation on how to properly set environment variables for Node.js applications.