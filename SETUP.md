# MailWeaver Setup Guide

## 🚀 Quick Setup

Run the automated setup script:
```bash
npm run setup
```

## 📋 Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file with:
```env
# Database
POSTGRES_URL="your_postgresql_connection_string"
POSTGRES_URL_NON_POOLING="your_postgresql_connection_string"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"

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

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Database Migrations
```bash
npx prisma migrate deploy
```

### 5. Build the Application
```bash
npm run build
```

## 🔧 Troubleshooting

### Prisma Client Issues
If you encounter Prisma client errors:
1. Delete `node_modules/.prisma` folder
2. Run `npx prisma generate`
3. Restart your development server

### TypeScript Errors
If you see TypeScript errors:
1. Run `npm install` to ensure all dependencies are installed
2. Run `npx prisma generate` to generate Prisma types
3. Restart your TypeScript server

### Build Errors
If the build fails:
1. Check that all environment variables are set
2. Ensure Prisma client is generated
3. Run `npm run setup` for automated setup

## 📁 Project Structure
```
bulk-mail-app/
├── app/                    # Next.js App Router
├── lib/                    # Utilities and database
│   ├── db.ts              # Database exports
│   ├── prisma-client.ts   # Prisma client configuration
│   ├── db-wrapper.ts      # Safe database operations
│   └── security.ts        # Security utilities
├── prisma/                # Database schema and migrations
├── scripts/               # Setup and utility scripts
└── public/               # Static assets
```

## 🚀 Deployment

### Vercel Deployment
The project is configured for Vercel deployment with:
- Automatic Prisma client generation
- Database migrations on build
- Optimized build process

### Environment Variables for Production
Ensure all environment variables are set in your Vercel dashboard:
- Database URLs
- OAuth credentials
- API keys
- NextAuth secret

## 🛠️ Development

### Start Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm run test
```

### Lint Code
```bash
npm run lint
```

## 📞 Support

If you encounter any issues:
1. Check this setup guide
2. Run `npm run setup` for automated setup
3. Check the troubleshooting section
4. Ensure all environment variables are properly configured
