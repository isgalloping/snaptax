import { prisma } from "@/lib/prisma";
import { migrateEventStoreOnGhostBind } from "@/lib/server/migrateEventStoreOnGhostBind";

export type OrphanGhostMergeDb = Pick<
  typeof prisma,
  | "snaptaxGhostAccount"
  | "snaptaxReceipt"
  | "snaptaxReceiptEvent"
  | "snaptaxReceiptLifecycleSnapshot"
  | "snaptaxReceiptSyncCursor"
>;

export type OrphanGhostMergeEntry = {
  ghostId: string;
  receipts: number;
  events: number;
  snapshots: number;
  cursorMerged: boolean;
};

export type OrphanGhostMergeResult = {
  merged: OrphanGhostMergeEntry[];
  mergedGhostIds: string[];
  totalReceipts: number;
};

/** True when ghost is unbound or already bound to this user. */
export async function isOrphanGhostMergeable(
  ghostId: string,
  userId: string,
  db: Pick<typeof prisma, "snaptaxGhostAccount"> = prisma,
): Promise<boolean> {
  const binding = await db.snaptaxGhostAccount.findUnique({
    where: { ghostId },
    select: { userId: true },
  });
  if (!binding) return true;
  return binding.userId === userId;
}

export async function listHistoricalGhostIdsForUser(
  userId: string,
  db: Pick<typeof prisma, "snaptaxReceipt"> = prisma,
): Promise<string[]> {
  const rows = await db.snaptaxReceipt.findMany({
    where: { userId, ghostId: { not: null } },
    select: { ghostId: true },
    distinct: ["ghostId"],
  });
  return rows
    .map((row) => row.ghostId)
    .filter((ghostId): ghostId is string => ghostId != null && ghostId.length > 0);
}

/** Attach server-derived orphan ghost receipts + Event Store rows to user (rebind / historical ghosts). */
export async function mergeOrphanGhostData(
  userId: string,
  ghostIds: string[],
  db: OrphanGhostMergeDb = prisma,
): Promise<OrphanGhostMergeResult> {
  const merged: OrphanGhostMergeEntry[] = [];
  const mergedGhostIds: string[] = [];
  let totalReceipts = 0;

  for (const ghostId of [...new Set(ghostIds)]) {
    if (!(await isOrphanGhostMergeable(ghostId, userId, db))) {
      continue;
    }

    const receipts = await db.snaptaxReceipt.updateMany({
      where: { ghostId, userId: null },
      data: { userId },
    });
    const eventMigration = await migrateEventStoreOnGhostBind(userId, ghostId, db);

    if (
      receipts.count === 0 &&
      eventMigration.events === 0 &&
      eventMigration.snapshots === 0 &&
      !eventMigration.cursorMerged
    ) {
      continue;
    }

    merged.push({
      ghostId,
      receipts: receipts.count,
      events: eventMigration.events,
      snapshots: eventMigration.snapshots,
      cursorMerged: eventMigration.cursorMerged,
    });
    mergedGhostIds.push(ghostId);
    totalReceipts += receipts.count;
  }

  return { merged, mergedGhostIds, totalReceipts };
}
