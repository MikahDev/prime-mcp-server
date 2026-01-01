/**
 * Token bucket rate limiter for Prime API
 *
 * Limits enforced:
 * - 60 requests per minute (rolling window)
 * - 5000 requests per day (rolling 24-hour window)
 * - 5 concurrent requests maximum
 */

export interface RateLimitStatus {
  tokensRemaining: number;
  dailyRemaining: number;
  concurrentActive: number;
  nextRefill: Date;
  dailyReset: Date;
}

export class RateLimitError extends Error {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private dailyCount: number;
  private dailyReset: number;
  private concurrent: number;
  private waitingQueue: Array<() => void> = [];

  private readonly maxTokens = 60;
  private readonly refillInterval = 60000; // 1 minute in ms
  private readonly dailyLimit = 5000;
  private readonly maxConcurrent = 5;

  constructor() {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.dailyCount = 0;
    this.dailyReset = this.getNextMidnight();
    this.concurrent = 0;
  }

  private getNextMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  private refillTokens(): void {
    const now = Date.now();

    // Reset daily count at midnight
    if (now >= this.dailyReset) {
      this.dailyCount = 0;
      this.dailyReset = this.getNextMidnight();
    }

    // Refill per-minute tokens
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.refillInterval) {
      const refills = Math.floor(elapsed / this.refillInterval);
      this.tokens = Math.min(this.maxTokens, this.tokens + refills * this.maxTokens);
      this.lastRefill = now - (elapsed % this.refillInterval);
    }
  }

  /**
   * Acquire a rate limit slot. Blocks until a slot is available.
   * Throws RateLimitError if daily limit is exceeded.
   */
  async acquire(): Promise<void> {
    this.refillTokens();

    // Check daily limit - this is a hard limit
    if (this.dailyCount >= this.dailyLimit) {
      const waitTime = Math.ceil((this.dailyReset - Date.now()) / 1000);
      throw new RateLimitError(
        `Daily limit of ${this.dailyLimit} requests exceeded. Resets in ${Math.ceil(waitTime / 3600)} hours.`,
        waitTime
      );
    }

    // Wait for concurrent slot
    while (this.concurrent >= this.maxConcurrent) {
      await this.waitForSlot();
    }

    // Wait for per-minute token
    while (this.tokens <= 0) {
      const waitTime = this.refillInterval - (Date.now() - this.lastRefill);
      await this.sleep(Math.max(waitTime, 100));
      this.refillTokens();
    }

    this.tokens--;
    this.dailyCount++;
    this.concurrent++;
  }

  /**
   * Release a rate limit slot after request completes
   */
  release(): void {
    this.concurrent = Math.max(0, this.concurrent - 1);

    // Notify waiting requests
    const next = this.waitingQueue.shift();
    if (next) {
      next();
    }
  }

  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update rate limit status from API response headers
   */
  updateFromHeaders(headers: Headers): void {
    const minuteRemaining = headers.get('x-ratelimit-minute-remaining');
    const dayRemaining = headers.get('x-ratelimit-day-remaining');

    if (minuteRemaining !== null) {
      const remaining = parseInt(minuteRemaining, 10);
      if (!isNaN(remaining)) {
        this.tokens = Math.min(remaining, this.tokens);
      }
    }

    if (dayRemaining !== null) {
      const remaining = parseInt(dayRemaining, 10);
      if (!isNaN(remaining)) {
        // Sync daily count with server
        this.dailyCount = this.dailyLimit - remaining;
      }
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(): RateLimitStatus {
    this.refillTokens();
    return {
      tokensRemaining: this.tokens,
      dailyRemaining: this.dailyLimit - this.dailyCount,
      concurrentActive: this.concurrent,
      nextRefill: new Date(this.lastRefill + this.refillInterval),
      dailyReset: new Date(this.dailyReset)
    };
  }

  /**
   * Check if we're near rate limits
   */
  isNearLimit(): boolean {
    this.refillTokens();
    return this.tokens <= 5 || (this.dailyLimit - this.dailyCount) <= 100;
  }
}
