import { prisma } from "@/lib/prisma";
import { migrateEventStoreOnGhostBind } from "@/lib/server/migrateEventStoreOnGhostBind";
import {
  runOrphanGhostMergeForUser,
  type OrphanGhostMergeResult,
} from "@/lib/server/runOrphanGhostMergeForUser";
import { utcNow } from "@/lib/time/utc";

export type GhostBindTxDb = Pick<
  typeof prisma,
  | "snaptaxGhostAccount"
  | "snaptaxReceipt"
  | "snaptaxReceiptEvent"
  | "snaptaxReceiptLifecycleSnapshot"
  | "snaptaxReceiptSyncCursor"
>;

export type GhostBindMigrationResult = Awaited<
  ReturnType<typeof migrateEventStoreOnGhostBind>
> & {
  rebindPreviousGhostId: string | null;
  orphanMerge: OrphanGhostMergeResult;
};

/** Upsert ghost↔user binding, migrate receipts + Event Store — single transaction. */
export async function bindGhostAndMigrateData(
  userId: string,
  ghostId: string,
  opts: {
    existingGhostBinding: { userId: string } | null;
    userBinding: { ghostId: string } | null;
    clientOrphanGhostIds?: string[];
  },
  db: GhostBindTxDb = prisma,
): Promise<GhostBindMigrationResult> {
  let rebindPreviousGhostId: string | null = null;

  if (opts.userBinding) {
    if (opts.userBinding.ghostId !== ghostId) {
      rebindPreviousGhostId = opts.userBinding.ghostId;
      await db.snaptaxGhostAccount.update({
        where: { userId },
        data: { ghostId, boundAt: utcNow() },
      });
    }
  } else if (!opts.existingGhostBinding) {
    await db.snaptaxGhostAccount.create({
      data: { ghostId, userId },
    });
  }

  await db.snaptaxReceipt.updateMany({
    where: { ghostId, userId: null },
    data: { userId },
  });
  const migration = await migrateEventStoreOnGhostBind(userId, ghostId, db);
  const orphanMerge = await runOrphanGhostMergeForUser(
    {
      userId,
      currentGhostId: ghostId,
      rebindPreviousGhostId,
      clientOrphanGhostIds: opts.clientOrphanGhostIds,
    },
    db,
  );

  return { ...migration, rebindPreviousGhostId, orphanMerge };
}
