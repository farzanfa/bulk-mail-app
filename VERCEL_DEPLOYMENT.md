# Vercel Deployment Guide for MailWeaver

## 🚀 Quick Deploy to Vercel

### 1. Connect to Vercel
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel
```

### 2. Environment Variables Setup

In your Vercel dashboard, add these environment variables:

#### **Required Variables:**
```env
# Database
POSTGRES_URL="your_postgresql_connection_string"
POSTGRES_URL_NON_POOLING="your_postgresql_connection_string"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your_nextauth_secret_key"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Gmail API
GMAIL_CLIENT_ID="your_gmail_client_id"
GMAIL_CLIENT_SECRET="your_gmail_client_secret"

# Razorpay
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

#### **Optional Variables:**
```env
# Analytics
NEXT_PUBLIC_GA_ID="your_google_analytics_id"

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_CHAT="true"
```

### 3. Database Setup

#### **Using Vercel Postgres (Recommended):**
1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection strings to your environment variables
4. Run migrations: `npx prisma migrate deploy`

#### **Using External Database:**
1. Set up your PostgreSQL database (Supabase, PlanetScale, etc.)
2. Add connection strings to environment variables
3. Ensure your database allows connections from Vercel

### 4. Domain Configuration

#### **Custom Domain (Optional):**
1. In Vercel dashboard, go to Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` to your custom domain
4. Configure DNS records as instructed

### 5. Build Configuration

The project is pre-configured for Vercel with:

```json
{
  "buildCommand": "npm run vercel-build",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### 6. Performance Optimizations

#### **Automatic Optimizations:**
- ✅ Edge Runtime compatibility
- ✅ Automatic compression
- ✅ Static asset optimization
- ✅ Security headers
- ✅ Caching strategies

#### **Function Timeouts:**
- API routes: 30-60 seconds (configured in `vercel.json`)
- Background jobs: 60 seconds max

### 7. Monitoring & Analytics

#### **Vercel Analytics:**
```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Already configured in the app
```

#### **Error Monitoring:**
- Built-in Vercel error tracking
- Custom error logging in `lib/security.ts`

### 8. Troubleshooting

#### **Common Issues:**

**Build Failures:**
```bash
# Clear Vercel cache
vercel --force

# Check build logs in Vercel dashboard
```

**Database Connection Issues:**
```bash
# Verify environment variables
vercel env ls

# Test database connection
vercel env pull .env.local
npm run prisma:generate
```

**Prisma Engine Issues:**
```bash
# Regenerate Prisma client
npx prisma generate

# Check binary targets in schema.prisma
```

### 9. Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Error monitoring active
- [ ] Backup strategy in place
- [ ] Performance monitoring enabled

### 10. Scaling Considerations

#### **Vercel Pro Features:**
- Unlimited bandwidth
- Advanced analytics
- Edge functions
- Preview deployments
- Team collaboration

#### **Database Scaling:**
- Consider connection pooling for high traffic
- Monitor database performance
- Set up read replicas if needed

### 11. Security Best Practices

#### **Implemented Security:**
- ✅ HTTPS enforced
- ✅ Security headers
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ Input sanitization
- ✅ SQL injection prevention

#### **Additional Recommendations:**
- Regular security audits
- Monitor for suspicious activity
- Keep dependencies updated
- Use strong passwords
- Enable 2FA where possible

## 🎯 Deployment Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

## 📞 Support

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js on Vercel**: https://nextjs.org/docs/deployment
- **Prisma on Vercel**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel

---

Your MailWeaver application is now optimized for Vercel deployment! 🚀
