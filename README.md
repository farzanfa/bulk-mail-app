# MailWeaver

MailWeaver is a modern bulk email platform built on Next.js 14 with Google Sign‑In and Gmail send. It handles templates, CSV uploads, campaigns, rate limiting, background sending, unsubscribe links, and more.

## Quick Start
- Copy `.env.example` to `.env.local` and fill values
- `npm i`
- `npx prisma migrate deploy`
- `npm run dev`

## Env Vars
- NEXTAUTH_URL, NEXTAUTH_SECRET
- POSTGRES_URL
- KV_REST_API_URL, KV_REST_API_TOKEN
- BLOB_READ_WRITE_TOKEN
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- CRON_SECRET (protects cron/worker endpoints)
- ENCRYPTION_KEY (32‑byte)
- STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY (for payment processing)
- STRIPE_WEBHOOK_SECRET (optional, for webhook verification)

## Features
- Google Sign‑In with Gmail send (scopes: gmail.send, openid, email, profile)
- Templates with variables ({{ first_name }}), versioning, preview; edit/create in modals
- Uploads: CSV → contacts; robust parsing with header normalization
- Campaigns: wizard with name, template, upload, Google account; dry run; Run now; progress
- Background sending with token‑bucket rate limiting and retries
- Daily cron trigger (compatible with Vercel Hobby); token‑secured worker endpoints
- Unsubscribe token and footer
- Responsive UI; PWA meta for mobile add‑to‑home
- Stripe payment integration for subscription plans

## Production
- Set env vars in Vercel (Production): all above + NEXTAUTH_URL
- Create Neon Postgres, Upstash Redis (KV), and Vercel Blob storage; paste credentials
- Cron (Hobby): schedule daily; we added a Run now button for manual trigger
- After schema changes: `npx prisma migrate deploy`

## Security & Privacy
- Google tokens are encrypted at rest; HTTPS enforced
- Google user data usage follows the Google API Services User Data Policy (Limited Use)
- Payment processing handled securely through Stripe (PCI-DSS compliant)

## Payment Setup
Payment integration is being set up with Stripe. Configuration instructions will be available soon.

## Developer
- Brand: MailWeaver
- Author: Farzan Arshad (`https://www.farzanfa.com`)


