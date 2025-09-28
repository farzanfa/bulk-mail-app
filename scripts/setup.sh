#!/bin/bash

echo "🚀 Setting up MailWeaver application..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Check if build works
echo "🏗️ Testing build..."
npm run build

echo "✅ Setup complete!"
