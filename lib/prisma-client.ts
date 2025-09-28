import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Custom Prisma client configuration for Vercel
const createPrismaClient = () => {
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
};

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Handle cleanup on hot reload in development
if (process.env.NODE_ENV === 'development') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
