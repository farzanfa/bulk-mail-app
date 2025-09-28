// Prisma client will be generated after running: npx prisma generate
// For now, we'll create a placeholder that will work once Prisma is properly set up

declare global {
  // eslint-disable-next-line no-var
  var prisma: any | undefined;
  // eslint-disable-next-line no-var
  var process: any;
  // eslint-disable-next-line no-var
  var require: any;
}

// Placeholder Prisma client - will be replaced once Prisma is generated
const createPrismaClient = () => {
  // This will work once @prisma/client is properly installed and generated
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
    
    const databaseUrl = process.env.POSTGRES_URL || '';
    const urlWithTimeout = databaseUrl.includes('connect_timeout') 
      ? databaseUrl 
      : `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}connect_timeout=30&pool_timeout=30&statement_timeout=30000&idle_in_transaction_session_timeout=60000`;

    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: urlWithTimeout,
        },
      },
      errorFormat: 'pretty',
      transactionOptions: {
        maxWait: 10000,
        timeout: 30000,
      },
    });
  } catch (error) {
    console.error('Prisma client not available. Please run: npx prisma generate');
    return null;
  }
};

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Handle cleanup on hot reload in development
if (process.env.NODE_ENV === 'development') {
  process.on('beforeExit', async () => {
    if (prisma && prisma.$disconnect) {
      await prisma.$disconnect();
    }
  });
}
