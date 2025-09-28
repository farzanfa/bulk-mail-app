import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Configure Prisma Client with connection pooling and proper timeout settings
const prismaClientSingleton = () => {
  // Add connection timeout to the URL if not already present
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
    // Add error formatting to get better error messages
    errorFormat: 'pretty',
    // Performance optimizations
    transactionOptions: {
      maxWait: 10000, // 10 seconds
      timeout: 30000, // 30 seconds
    },
    // Use library engine for better Vercel compatibility
    __internal: {
      engine: {
        binaryTargets: ['native', 'rhel-openssl-1.0.x', 'rhel-openssl-3.0.x']
      }
    }
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Handle cleanup on hot reload in development
if (process.env.NODE_ENV === 'development') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}