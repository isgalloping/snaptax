import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

function redisOrNull(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

function ghostLimiter(): Ratelimit | null {
  const redis = redisOrNull();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      Number(process.env.RECEIPT_GHOST_HOURLY ?? 10),
      "1 h",
    ),
    prefix: "rl:ghost:receipt",
  });
}

function ipLimiter(): Ratelimit | null {
  const redis = redisOrNull();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "rl:ip:receipt",
  });
}

export async function checkIpReceiptLimit(ip: string): Promise<LimitResult> {
  const limiter = ipLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(ip);
  if (success) return { ok: true };
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
}

export async function checkGhostReceiptLimit(
  ghostId: string,
): Promise<LimitResult> {
  const limiter = ghostLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(ghostId);
  if (success) return { ok: true };
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}
