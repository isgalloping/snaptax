import type { Prisma } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";
import { appendTaxCalculatedSnapshots } from "@/lib/server/receiptLifecycleSnapshots";
import type { TaxCalculatedEventInput } from "@/lib/server/receiptLifecycleSnapshots";
import { advanceActorReceiptSyncCursor } from "@/lib/server/receiptSyncCursor";
import type { ReceiptSyncCursorEvent } from "@/lib/server/receiptSyncCursor";
import { prisma } from "@/lib/prisma";

export type IngestReceiptEventBatchInput = {
  actor: Actor;
  rows: Prisma.SnaptaxReceiptEventCreateManyInput[];
  cursorEvents: ReceiptSyncCursorEvent[];
  taxCalculatedEvents: TaxCalculatedEventInput[];
};

export type IngestReceiptEventBatchDb = Pick<
  typeof prisma,
  | "snaptaxReceiptEvent"
  | "snaptaxReceiptLifecycleSnapshot"
  | "snaptaxReceiptSyncCursor"
  | "$transaction"
>;

async function ingestReceiptEventBatchInTx(
  input: IngestReceiptEventBatchInput,
  tx: Pick<
    typeof prisma,
    | "snaptaxReceiptEvent"
    | "snaptaxReceiptLifecycleSnapshot"
    | "snaptaxReceiptSyncCursor"
  >,
): Promise<{
  inserted: number;
  snapshotsInserted: number;
  cursor: Awaited<ReturnType<typeof advanceActorReceiptSyncCursor>>;
}> {
  const result = await tx.snaptaxReceiptEvent.createMany({
    data: input.rows,
    skipDuplicates: true,
  });
  const snapshotsInserted = await appendTaxCalculatedSnapshots(
    input.actor,
    input.taxCalculatedEvents,
    tx,
  );
  const cursor = await advanceActorReceiptSyncCursor(
    input.actor,
    input.cursorEvents,
    tx,
  );
  return {
    inserted: result.count,
    snapshotsInserted,
    cursor,
  };
}

/** Append-only event ingest: events + TAX_CALCULATED snapshots + sync cursor in one tx. */
export async function ingestReceiptEventBatch(
  input: IngestReceiptEventBatchInput,
  db: IngestReceiptEventBatchDb = prisma,
): Promise<{
  inserted: number;
  snapshotsInserted: number;
  cursor: Awaited<ReturnType<typeof advanceActorReceiptSyncCursor>>;
}> {
  if (db === prisma) {
    return prisma.$transaction((tx) => ingestReceiptEventBatchInTx(input, tx));
  }
  return ingestReceiptEventBatchInTx(input, db);
}
