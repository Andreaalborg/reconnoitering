import * as Sentry from '@sentry/nextjs';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  async isAllowed(identifier: string): Promise<boolean> {
    const now = Date.now();
    const record = this.store[identifier];

    if (!record || now > record.resetTime) {
      // Create new record
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return true;
    }

    if (record.count >= this.maxRequests) {
      // Log potential brute force attempt
      Sentry.captureMessage(`Rate limit exceeded for ${identifier}`, {
        level: 'warning',
        tags: { security: 'rate-limit' },
        extra: { 
          identifier,
          count: record.count,
          maxRequests: this.maxRequests
        }
      });
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.store[identifier];
    if (!record) return 0;
    
    const remaining = record.resetTime - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }
}

// Create rate limiters for different endpoints
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
export const apiRateLimiter = new RateLimiter(60 * 1000, 100); // 100 requests per minute