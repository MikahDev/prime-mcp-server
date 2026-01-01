/**
 * Rate limiter unit tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, RateLimitError } from '../../src/client/rate-limiter.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('acquire', () => {
    it('should allow requests within rate limit', async () => {
      await expect(rateLimiter.acquire()).resolves.toBeUndefined();
      rateLimiter.release();

      const status = rateLimiter.getStatus();
      expect(status.tokensRemaining).toBe(59);
    });

    it('should track concurrent requests', async () => {
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      const status = rateLimiter.getStatus();
      expect(status.concurrentActive).toBe(2);

      rateLimiter.release();
      rateLimiter.release();

      const newStatus = rateLimiter.getStatus();
      expect(newStatus.concurrentActive).toBe(0);
    });

    it('should decrement tokens on acquire', async () => {
      const initialStatus = rateLimiter.getStatus();
      const initialTokens = initialStatus.tokensRemaining;

      await rateLimiter.acquire();
      rateLimiter.release();

      const newStatus = rateLimiter.getStatus();
      expect(newStatus.tokensRemaining).toBe(initialTokens - 1);
    });

    it('should track daily count', async () => {
      const initialStatus = rateLimiter.getStatus();
      const initialDaily = initialStatus.dailyRemaining;

      await rateLimiter.acquire();
      rateLimiter.release();

      const newStatus = rateLimiter.getStatus();
      expect(newStatus.dailyRemaining).toBe(initialDaily - 1);
    });
  });

  describe('release', () => {
    it('should decrement concurrent count', async () => {
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      expect(rateLimiter.getStatus().concurrentActive).toBe(2);

      rateLimiter.release();
      expect(rateLimiter.getStatus().concurrentActive).toBe(1);

      rateLimiter.release();
      expect(rateLimiter.getStatus().concurrentActive).toBe(0);
    });

    it('should not go below zero concurrent', () => {
      rateLimiter.release();
      rateLimiter.release();

      expect(rateLimiter.getStatus().concurrentActive).toBe(0);
    });
  });

  describe('getStatus', () => {
    it('should return correct initial status', () => {
      const status = rateLimiter.getStatus();

      expect(status.tokensRemaining).toBe(60);
      expect(status.dailyRemaining).toBe(5000);
      expect(status.concurrentActive).toBe(0);
      expect(status.nextRefill).toBeInstanceOf(Date);
      expect(status.dailyReset).toBeInstanceOf(Date);
    });
  });

  describe('isNearLimit', () => {
    it('should return false when plenty of tokens available', () => {
      expect(rateLimiter.isNearLimit()).toBe(false);
    });

    it('should return true when tokens are low', async () => {
      // Exhaust most tokens
      for (let i = 0; i < 56; i++) {
        await rateLimiter.acquire();
        rateLimiter.release();
      }

      expect(rateLimiter.isNearLimit()).toBe(true);
    });
  });

  describe('updateFromHeaders', () => {
    it('should update tokens from response headers', async () => {
      await rateLimiter.acquire();
      rateLimiter.release();

      const headers = new Headers();
      headers.set('x-ratelimit-minute-remaining', '45');
      headers.set('x-ratelimit-day-remaining', '4500');

      rateLimiter.updateFromHeaders(headers);

      const status = rateLimiter.getStatus();
      expect(status.tokensRemaining).toBe(45);
      expect(status.dailyRemaining).toBe(4500);
    });

    it('should handle missing headers gracefully', () => {
      const headers = new Headers();
      rateLimiter.updateFromHeaders(headers);

      // Should not throw and status should be unchanged
      const status = rateLimiter.getStatus();
      expect(status.tokensRemaining).toBe(60);
    });
  });

  describe('token refill', () => {
    it('should refill tokens after interval', async () => {
      // Use up some tokens
      for (let i = 0; i < 10; i++) {
        await rateLimiter.acquire();
        rateLimiter.release();
      }

      expect(rateLimiter.getStatus().tokensRemaining).toBe(50);

      // Advance time by 1 minute
      vi.advanceTimersByTime(60000);

      // Tokens should be refilled
      const status = rateLimiter.getStatus();
      expect(status.tokensRemaining).toBe(60);
    });
  });
});

describe('RateLimitError', () => {
  it('should create error with message and retry after', () => {
    const error = new RateLimitError('Rate limited', 30);

    expect(error.message).toBe('Rate limited');
    expect(error.retryAfter).toBe(30);
    expect(error.name).toBe('RateLimitError');
  });

  it('should have default retry after of 60', () => {
    const error = new RateLimitError('Rate limited');

    expect(error.retryAfter).toBe(60);
  });
});
