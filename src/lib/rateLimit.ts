import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DEFAULT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);
const DEFAULT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '30', 10);

const limiters = new Map<string, Ratelimit>();

function getLimiter(windowMs: number, maxRequests: number): Ratelimit {
  const key = `${windowMs}:${maxRequests}`;
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${Math.floor(windowMs / 1000)} s`),
      analytics: false,
    }));
  }
  return limiters.get(key)!;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
  windowMs = DEFAULT_WINDOW_MS,
  maxRequests = DEFAULT_MAX_REQUESTS
): Promise<RateLimitResult> {
  const limiter = getLimiter(windowMs, maxRequests);
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { allowed: success, remaining, resetAt: reset };
}

export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return '127.0.0.1';
}
