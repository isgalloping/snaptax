import type { Prisma } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";

export type TaxCalculatedEventInput = {
  id: string;
  receiptId: string;
  payload: Record<string, unknown>;
  createdAtMs: number;
};

type SnapshotDb = Pick<typeof prisma, "snaptaxReceiptLifecycleSnapshot">;

function actorKeys(actor: Actor): { userId: string | null; ghostId: string | null } {
  if (actor.kind === "user") {
    return { userId: actor.userId, ghostId: actor.ghostId ?? null };
  }
  return { userId: null, ghostId: actor.ghostId };
}

/** Append-only snapshots for TAX_CALCULATED events (idempotent by source_event_id). */
export async function appendTaxCalculatedSnapshots(
  actor: Actor,
  events: TaxCalculatedEventInput[],
  db: SnapshotDb = prisma,
): Promise<number> {
  if (events.length === 0) return 0;
  const keys = actorKeys(actor);
  const rows = events.map((event) => ({
    receiptId: event.receiptId,
    userId: keys.userId,
    ghostId: keys.ghostId,
    sourceEventId: event.id,
    payload: event.payload as Prisma.InputJsonValue,
    clientCreatedAt: new Date(event.createdAtMs),
  }));
  const result = await db.snaptaxReceiptLifecycleSnapshot.createMany({
    data: rows,
    skipDuplicates: true,
  });
  return result.count;
}
