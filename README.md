# Bulk Mail App (Vercel-native)

End-to-end bulk email platform built on Next.js 14, Vercel Postgres, KV, Blob, Cron/Background Functions, and Gmail API.

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
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
- ENCRYPTION_KEY (32-byte hex/base64)

## Features
- Auth (register, verify, login), link Gmail via OAuth
- Templates: liquid-style variables, versioning, preview
- Uploads: CSV to Blob, parse to contacts
- Contacts: search, paginate, bulk delete/unsubscribe
- Campaigns: wizard, dry run, launch, progress, export CSV
- Workers: cron every minute, background batch sender
- Rate limiting + exponential backoff, idempotency
- Unsubscribe link per user

## Production
- Add Vercel Cron to call `/api/jobs/cron` every minute
- Ensure DB/KV/Blob are created and env vars set in Vercel (Production scope)


