export type RateLimitDecision =
  | Readonly<{ allowed: true; remaining: number }>
  | Readonly<{ allowed: false; retryAfterSeconds: number }>;

type FixedWindowRateLimiterOptions = Readonly<{
  limit: number;
  now?: () => number;
  windowMs: number;
}>;

type RateLimitBucket = {
  count: number;
  startedAt: number;
};

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly limit: number;
  private readonly now: () => number;
  private readonly windowMs: number;

  constructor(options: FixedWindowRateLimiterOptions) {
    if (options.limit < 1 || options.windowMs < 1) {
      throw new Error("Rate limit and window must be positive.");
    }

    this.limit = options.limit;
    this.now = options.now ?? Date.now;
    this.windowMs = options.windowMs;
  }

  consume(key: string): RateLimitDecision {
    const now = this.now();
    const existing = this.buckets.get(key);

    if (!existing || now - existing.startedAt >= this.windowMs) {
      this.buckets.set(key, { count: 1, startedAt: now });
      this.prune(now);
      return { allowed: true, remaining: this.limit - 1 };
    }

    if (existing.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.startedAt + this.windowMs - now) / 1_000),
        ),
      };
    }

    existing.count += 1;
    return { allowed: true, remaining: this.limit - existing.count };
  }

  private prune(now: number) {
    if (this.buckets.size < 100) {
      return;
    }

    for (const [key, bucket] of this.buckets) {
      if (now - bucket.startedAt >= this.windowMs) {
        this.buckets.delete(key);
      }
    }
  }
}
