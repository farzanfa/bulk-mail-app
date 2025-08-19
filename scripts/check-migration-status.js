const { execSync } = require('child_process');

console.log('Checking migration status for Vercel deployment...\n');

// Set temporary environment variables for the check
process.env.POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://dummy';
process.env.POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || 'postgresql://dummy';

try {
  // Check if we can connect to the database
  if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('neondb')) {
    console.log('✅ Database URLs are configured by Vercel');
    console.log(`   POSTGRES_URL: ${process.env.POSTGRES_URL.substring(0, 30)}...`);
    console.log(`   POSTGRES_URL_NON_POOLING: ${process.env.POSTGRES_URL_NON_POOLING ? 'Set' : 'Not set'}\n`);
  }

  // List migrations
  console.log('📁 Available migrations:');
  const migrations = execSync('ls -la prisma/migrations/', { encoding: 'utf8' });
  console.log(migrations);

  // Check latest migration
  console.log('📝 Latest migration appears to be: 20250123000000_baseline_with_razorpay');
  console.log('   This includes: plans, user_subscriptions, payments tables\n');

  console.log('ℹ️  To check migration status on Vercel:');
  console.log('   1. Deploy your application');
  console.log('   2. Run: vercel env pull .env.local');
  console.log('   3. Run: npx prisma migrate status\n');

  console.log('ℹ️  To apply migrations on Vercel:');
  console.log('   Option 1: Add to build command in vercel.json:');
  console.log('   "buildCommand": "npx prisma generate && npx prisma migrate deploy && next build"\n');
  console.log('   Option 2: Run manually after deployment:');
  console.log('   vercel env pull .env.production.local');
  console.log('   npx prisma migrate deploy\n');

} catch (error) {
  console.error('Error checking migrations:', error.message);
}