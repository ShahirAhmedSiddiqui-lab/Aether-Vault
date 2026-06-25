import { type NextRequest } from 'next/server';
import { ApiRouteError } from '@/lib/api/errors';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
  code?: string;
};

const store = new Map<string, RateLimitEntry>();

export function getClientIp(req: Request | NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function enforceRateLimit(options: RateLimitOptions) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const existing = store.get(options.key);
  if (!existing || existing.resetAt <= now) {
    store.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return;
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    throw new ApiRouteError(429, options.message ?? 'Too many requests. Please try again shortly.', {
      code: options.code ?? 'rate_limited',
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
      details: {
        retryAfterSeconds,
      },
    });
  }

  existing.count += 1;
  store.set(options.key, existing);
}

function cleanupExpiredEntries(now: number) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}
