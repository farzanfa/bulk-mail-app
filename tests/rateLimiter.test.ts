import { describe, it, expect } from 'vitest';
import { backoffDelayMs } from '@/lib/rateLimiter';

describe('rateLimiter', () => {
  it('backoff caps at 60s', () => {
    expect(backoffDelayMs(1)).toBeGreaterThan(0);
    expect(backoffDelayMs(10)).toBeLessThanOrEqual(60000);
  });
});


