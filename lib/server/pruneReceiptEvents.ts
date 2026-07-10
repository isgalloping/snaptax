import { logEvent } from "@/lib/server/log/logEvent";
import { prisma } from "@/lib/prisma";

export const RECEIPT_EVENT_SERVER_RETENTION_MONTHS = 18;
export const RECEIPT_EVENT_PRUNE_SAMPLE_RATE = 0.02;
export const RECEIPT_EVENT_PRUNE_BATCH_SIZE = 1000;

let pruneInFlight: Promise<number> | null = null;

export function receiptEventServerRetentionCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RECEIPT_EVENT_SERVER_RETENTION_MONTHS);
  return cutoff;
}

export async function pruneReceiptEventsOlderThan(
  cutoff: Date,
  batchSize = RECEIPT_EVENT_PRUNE_BATCH_SIZE,
): Promise<number> {
  let total = 0;
  while (true) {
    const batch = await prisma.snaptaxReceiptEvent.findMany({
      where: { clientCreatedAt: { lt: cutoff } },
      select: { id: true },
      take: batchSize,
    });
    if (batch.length === 0) break;
    const result = await prisma.snaptaxReceiptEvent.deleteMany({
      where: { id: { in: batch.map((row) => row.id) } },
    });
    total += result.count;
    if (batch.length < batchSize) break;
  }
  return total;
}

async function runSampledReceiptEventPrune(nowMs = Date.now()): Promise<number> {
  const cutoff = receiptEventServerRetentionCutoff(new Date(nowMs));
  const deletedCount = await pruneReceiptEventsOlderThan(cutoff);
  logEvent({
    ts: new Date().toISOString(),
    level: "info",
    module: "api.sync",
    success: true,
    durationMs: 0,
    meta: {
      reason: "receipt_event_prune",
      deletedCount,
      cutoff: cutoff.toISOString(),
    },
  });
  return deletedCount;
}

/** Sampled lazy GC on event ingest — awaited when sampled to survive serverless. */
export async function maybePruneOldReceiptEvents(
  nowMs = Date.now(),
): Promise<number | null> {
  if (Math.random() >= RECEIPT_EVENT_PRUNE_SAMPLE_RATE) return null;
  if (pruneInFlight) return pruneInFlight;
  pruneInFlight = runSampledReceiptEventPrune(nowMs)
    .catch((err) => {
      logEvent({
        ts: new Date().toISOString(),
        level: "warn",
        module: "api.sync",
        success: false,
        durationMs: 0,
        meta: {
          reason: "receipt_event_prune_failed",
          errorMessage:
            err instanceof Error ? err.message.slice(0, 120) : "unknown",
        },
      });
      return 0;
    })
    .finally(() => {
      pruneInFlight = null;
    });
  return pruneInFlight;
}
