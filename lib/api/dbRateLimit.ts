import { prisma } from "@/lib/prisma";

export type RateLimitResult =
  | { ok: true; count: number }
  | { ok: false; retryAfterSec: number; count: number };

export function floorWindowStartMs(nowMs: number, windowMs: number): number {
  return Math.floor(nowMs / windowMs) * windowMs;
}

export function retryAfterSecFromWindow(
  windowStartMs: number,
  windowMs: number,
  nowMs: number = Date.now(),
): number {
  const windowEndMs = windowStartMs + windowMs;
  return Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
}

const GC_RETENTION_MS = 24 * 60 * 60 * 1000;
const GC_SAMPLE_RATE = 0.02;

let gcInFlight: Promise<void> | null = null;

async function pruneStaleBuckets(before: Date): Promise<void> {
  await prisma.snaptaxRateLimitBucket.deleteMany({
    where: { windowStart: { lt: before } },
  });
}

function maybePruneStaleBuckets(before: Date): void {
  if (Math.random() >= GC_SAMPLE_RATE) return;
  if (gcInFlight) return;
  gcInFlight = pruneStaleBuckets(before)
    .catch(() => {})
    .finally(() => {
      gcInFlight = null;
    });
}

/** Single-statement upsert — avoids interactive transactions (P2028 on pooled connections). */
async function incrementRateLimitBucket(
  bucketKey: string,
  windowStart: Date,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number | bigint }>>`
    INSERT INTO snaptax_rate_limit_buckets (bucket_key, window_start, count, updated_at)
    VALUES (${bucketKey}, ${windowStart}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (bucket_key) DO UPDATE SET
      count = CASE
        WHEN snaptax_rate_limit_buckets.window_start = EXCLUDED.window_start
        THEN snaptax_rate_limit_buckets.count + 1
        ELSE 1
      END,
      window_start = EXCLUDED.window_start,
      updated_at = CURRENT_TIMESTAMP
    RETURNING count
  `;
  return Number(rows[0]?.count ?? 1);
}

export async function consumeRateLimit(params: {
  bucketKey: string;
  windowMs: number;
  limit: number;
  nowMs?: number;
}): Promise<RateLimitResult> {
  const nowMs = params.nowMs ?? Date.now();
  const windowStartMs = floorWindowStartMs(nowMs, params.windowMs);
  const windowStart = new Date(windowStartMs);
  const gcBefore = new Date(nowMs - GC_RETENTION_MS);

  const count = await incrementRateLimitBucket(params.bucketKey, windowStart);
  maybePruneStaleBuckets(gcBefore);

  if (count > params.limit) {
    return {
      ok: false,
      count,
      retryAfterSec: retryAfterSecFromWindow(windowStartMs, params.windowMs, nowMs),
    };
  }

  return { ok: true, count };
}
