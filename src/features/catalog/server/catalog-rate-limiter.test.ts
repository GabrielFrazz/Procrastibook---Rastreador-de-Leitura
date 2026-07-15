import { describe, expect, it } from "vitest";

import { FixedWindowRateLimiter } from "@/features/catalog/server/catalog-rate-limiter";

describe("FixedWindowRateLimiter", () => {
  it("bloqueia somente depois de consumir o limite", () => {
    const limiter = new FixedWindowRateLimiter({
      limit: 2,
      now: () => 1_000,
      windowMs: 60_000,
    });

    expect(limiter.consume("user-a")).toEqual({ allowed: true, remaining: 1 });
    expect(limiter.consume("user-a")).toEqual({ allowed: true, remaining: 0 });
    expect(limiter.consume("user-a")).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(limiter.consume("user-b")).toEqual({ allowed: true, remaining: 1 });
  });

  it("abre uma nova janela depois do intervalo", () => {
    let now = 0;
    const limiter = new FixedWindowRateLimiter({
      limit: 1,
      now: () => now,
      windowMs: 1_000,
    });

    expect(limiter.consume("user-a").allowed).toBe(true);
    expect(limiter.consume("user-a").allowed).toBe(false);
    now = 1_000;
    expect(limiter.consume("user-a")).toEqual({ allowed: true, remaining: 0 });
  });
});
