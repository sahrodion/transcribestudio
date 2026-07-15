interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalLimit = globalThis as typeof globalThis & {
  __transcribeRateLimit?: Map<string, RateLimitEntry>;
};

function store(): Map<string, RateLimitEntry> {
  if (!globalLimit.__transcribeRateLimit) {
    globalLimit.__transcribeRateLimit = new Map();
  }
  return globalLimit.__transcribeRateLimit;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entries = store();
  const existing = entries.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    entries.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  entries.set(key, existing);
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function clearRateLimitsForTests(): void {
  store().clear();
}
