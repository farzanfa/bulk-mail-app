import { Prisma } from '@prisma/client';

/**
 * Retry a Prisma operation with exponential backoff
 * Useful for handling transient connection errors with Neon's serverless compute
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    factor = 2,
  } = options;

  let lastError: Error | unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `Prisma operation failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: Database server was reached but timed out
    return ['P1001', 'P1002'].includes(error.code);
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    // Unknown errors might be transient network issues
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('closed') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }

  return false;
}

/**
 * Wrapper for Prisma operations with automatic retry
 * Example usage:
 * 
 * const user = await prismaWithRetry(prisma => 
 *   prisma.user.findUnique({ where: { id: userId } })
 * );
 */
export async function prismaWithRetry<T>(
  operation: (prisma: any) => Promise<T>,
  prismaClient: any
): Promise<T> {
  return withRetry(() => operation(prismaClient));
}