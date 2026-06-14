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

async function pruneStaleBuckets(before: Date): Promise<void> {
  await prisma.snaptaxRateLimitBucket.deleteMany({
    where: { windowStart: { lt: before } },
  });
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

  const count = await prisma.$transaction(async (tx) => {
    const existing = await tx.snaptaxRateLimitBucket.findUnique({
      where: { bucketKey: params.bucketKey },
    });

    let nextCount: number;
    if (
      !existing ||
      existing.windowStart.getTime() !== windowStartMs
    ) {
      const row = await tx.snaptaxRateLimitBucket.upsert({
        where: { bucketKey: params.bucketKey },
        create: {
          bucketKey: params.bucketKey,
          windowStart,
          count: 1,
        },
        update: {
          windowStart,
          count: 1,
        },
      });
      nextCount = row.count;
    } else {
      const row = await tx.snaptaxRateLimitBucket.update({
        where: { bucketKey: params.bucketKey },
        data: { count: { increment: 1 } },
      });
      nextCount = row.count;
    }

    await tx.snaptaxRateLimitBucket.deleteMany({
      where: { windowStart: { lt: gcBefore } },
    });

    return nextCount;
  });

  if (count > params.limit) {
    return {
      ok: false,
      count,
      retryAfterSec: retryAfterSecFromWindow(windowStartMs, params.windowMs, nowMs),
    };
  }

  return { ok: true, count };
}
