# 🚀 Vercel Deployment Checklist

## Pre-Deployment Setup

### ✅ Environment Variables (Set in Vercel Dashboard)
- [ ] `POSTGRES_URL` - Your PostgreSQL connection string
- [ ] `POSTGRES_URL_NON_POOLING` - Non-pooling connection string
- [ ] `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)
- [ ] `NEXTAUTH_SECRET` - Random secret key
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `GMAIL_CLIENT_ID` - Gmail API client ID
- [ ] `GMAIL_CLIENT_SECRET` - Gmail API client secret
- [ ] `RAZORPAY_KEY_ID` - Razorpay API key ID
- [ ] `RAZORPAY_KEY_SECRET` - Razorpay API secret

### ✅ Database Setup
- [ ] PostgreSQL database created (Vercel Postgres recommended)
- [ ] Database migrations ready
- [ ] Connection strings configured

### ✅ OAuth Setup
- [ ] Google OAuth app configured
- [ ] Redirect URIs updated for production
- [ ] Gmail API enabled and configured

### ✅ Payment Setup
- [ ] Razorpay account configured
- [ ] Webhook URLs updated for production

## Deployment Steps

### 1. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 2. Post-Deployment
- [ ] Test all major features
- [ ] Verify email sending works
- [ ] Test payment integration
- [ ] Check database connectivity
- [ ] Verify OAuth login

### 3. Domain Setup (Optional)
- [ ] Add custom domain in Vercel dashboard
- [ ] Update DNS records
- [ ] Update `NEXTAUTH_URL` environment variable
- [ ] Test custom domain

## 🎯 Quick Deploy Commands

```bash
# First time deployment
vercel

# Production deployment
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

## 🔧 Troubleshooting

### Common Issues:
1. **Build Failures**: Check environment variables
2. **Database Errors**: Verify connection strings
3. **OAuth Issues**: Check redirect URIs
4. **Payment Errors**: Verify Razorpay configuration

### Support Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

**Your MailWeaver app is ready for Vercel deployment!** 🚀
