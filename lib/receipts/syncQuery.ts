import type { Prisma } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";
import { receiptWhereForActor } from "@/lib/receipts/ownership";

export const RECEIPT_SYNC_DEFAULT_SINCE_MONTHS = 18;

export function defaultSyncSince(now = new Date()): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() - RECEIPT_SYNC_DEFAULT_SINCE_MONTHS);
  return d;
}

type SyncCursor = { updatedAt: Date; id: string };

export function encodeSyncCursor(updatedAt: Date, id: string): string {
  const payload = JSON.stringify({
    updatedAt: updatedAt.toISOString(),
    id,
  });
  return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodeSyncCursor(cursor: string): SyncCursor {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as { updatedAt?: string; id?: string };
    if (typeof parsed.updatedAt !== "string" || typeof parsed.id !== "string") {
      throw new Error("INVALID_SYNC_CURSOR");
    }
    const updatedAt = new Date(parsed.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) {
      throw new Error("INVALID_SYNC_CURSOR");
    }
    return { updatedAt, id: parsed.id };
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_SYNC_CURSOR") throw err;
    throw new Error("INVALID_SYNC_CURSOR");
  }
}

export function parseSyncLimit(raw: string | null, max = 50): number {
  const n = raw == null ? max : Number(raw);
  if (!Number.isFinite(n)) return max;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

export function buildSyncWhere(
  actor: Actor,
  since: Date,
  cursor?: SyncCursor,
): Prisma.SnaptaxReceiptWhereInput {
  return {
    ...receiptWhereForActor(actor),
    capturedAt: { gte: since },
    ...(cursor
      ? {
          OR: [
            { updatedAt: { lt: cursor.updatedAt } },
            { updatedAt: cursor.updatedAt, id: { lt: cursor.id } },
          ],
        }
      : {}),
  };
}
