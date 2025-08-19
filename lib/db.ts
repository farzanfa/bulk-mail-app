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
    : `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}connect_timeout=30&pool_timeout=30`;

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: urlWithTimeout,
      },
    },
    // Add error formatting to get better error messages
    errorFormat: 'pretty',
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