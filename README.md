# MailWeaver

MailWeaver is a modern bulk email platform built on Next.js 14 with Google Sign‑In and Gmail send. It handles templates, CSV uploads, campaigns, rate limiting, background sending, unsubscribe links, and more.

## Quick Start
- Copy `.env.example` to `.env.local` and fill values
- `npm i`
- `npx prisma migrate deploy`
- `npm run dev`

## Environment Variables

### Required
- `POSTGRES_URL` - PostgreSQL database connection string
- `NEXTAUTH_URL` - Your application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Random secret for NextAuth.js session encryption

### Optional Services
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - For Google OAuth integration
- `EMAIL_SERVER_*` - SMTP configuration for email sending
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` - For payment processing
- `RAZORPAY_WEBHOOK_SECRET` - For secure webhook verification
- `BLOB_STORE_URL`, `BLOB_STORE_KEY` - For file uploads
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` - Redis/KV store for rate limiting
- `CRON_SECRET` - Protects cron/worker endpoints
- `ENCRYPTION_KEY` - 32-byte key for encrypting sensitive data

## Features
- Google Sign‑In with Gmail send (scopes: gmail.send, openid, email, profile)
- Templates with variables ({{ first_name }}), versioning, preview; edit/create in modals
- Uploads: CSV → contacts; robust parsing with header normalization
- Campaigns: wizard with name, template, upload, Google account; dry run; Run now; progress
- Background sending with token‑bucket rate limiting and retries
- Daily cron trigger (compatible with Vercel Hobby); token‑secured worker endpoints
- Unsubscribe token and footer
- Responsive UI; PWA meta for mobile add‑to‑home
- Razorpay payment integration for subscription plans

## Production
- Set env vars in Vercel (Production): all above + NEXTAUTH_URL
- Create Neon Postgres, Upstash Redis (KV), and Vercel Blob storage; paste credentials
- Cron (Hobby): schedule daily; we added a Run now button for manual trigger
- After schema changes: `npx prisma migrate deploy`

## Security & Privacy
- Google tokens are encrypted at rest; HTTPS enforced
- Google user data usage follows the Google API Services User Data Policy (Limited Use)
- Payment processing handled securely through Razorpay (PCI-DSS compliant)

## Payment Setup
See [docs/RAZORPAY_SETUP.md](docs/RAZORPAY_SETUP.md) for detailed Razorpay configuration instructions.

## Developer
- Brand: MailWeaver
- Author: Farzan Arshad (`https://www.farzanfa.com`)


