import { del } from "@vercel/blob";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listHistoricalGhostIdsForUser } from "@/lib/server/mergeOrphanGhostData";
import { deleteEventStoreRecords } from "@/lib/server/receiptEventStoreCleanup";
import { logEvent } from "@/lib/server/log/logEvent";
import { blobCommandOptions } from "@/lib/server/blob";

export function userAccountReceiptFilter(
  userId: string,
  boundGhostId: string | null,
  historicalGhostIds: string[] = [],
): Prisma.SnaptaxReceiptWhereInput {
  const ghostIds = new Set<string>(historicalGhostIds);
  if (boundGhostId) ghostIds.add(boundGhostId);

  if (ghostIds.size === 0) {
    return { userId };
  }

  const or: Prisma.SnaptaxReceiptWhereInput[] = [{ userId }];
  for (const ghostId of ghostIds) {
    or.push({ ghostId, userId: null });
  }
  return { OR: or };
}

/** Deduped non-empty blob pathnames for `@vercel/blob` del. */
export function uniqueBlobPathnames(pathnames: string[]): string[] {
  return [
    ...new Set(
      pathnames.filter((path) => typeof path === "string" && path.length > 0),
    ),
  ];
}

export async function deleteReceiptBlobs(pathnames: string[]): Promise<void> {
  const targets = uniqueBlobPathnames(pathnames);
  if (targets.length === 0) return;
  try {
    await del(targets, blobCommandOptions());
  } catch (err) {
    logEvent({
      ts: new Date().toISOString(),
      level: "error",
      module: "api.user",
      success: false,
      durationMs: 0,
      meta: {
        reason: "blob_delete_failed",
        pathnameCount: targets.length,
        errorMessage:
          err instanceof Error ? err.message.slice(0, 120) : "unknown",
      },
    });
    throw new Error("BLOB_DELETE_FAILED");
  }
}

/** Ghost IDs safe to erase for a pure-Ghost delete. */
export async function resolveUnboundGhostIdsForDelete(
  currentGhostId: string,
  clientOrphanGhostIds: string[] = [],
): Promise<string[]> {
  void clientOrphanGhostIds;
  if (typeof currentGhostId !== "string" || currentGhostId.length === 0) {
    return [];
  }
  return [currentGhostId];
}

export async function deleteGhostReceipts(ghostId: string): Promise<void> {
  const ghostIds = await resolveUnboundGhostIdsForDelete(ghostId);
  const receipts = await prisma.snaptaxReceipt.findMany({
    where: { ghostId: { in: ghostIds }, userId: null },
    select: { id: true, imageUrl: true },
  });
  await deleteReceiptBlobs(receipts.map((r) => r.imageUrl));
  await deleteEventStoreRecords({ ghostIds });
  if (receipts.length > 0) {
    await prisma.snaptaxReceipt.deleteMany({
      where: { ghostId: { in: ghostIds }, userId: null },
    });
  }
}

export type UserAccountDeleteCounts = {
  receiptCount: number;
  entitlementCount: number;
  checkoutIntentCount: number;
};

export type UserAccountDbCleanupClient = {
  snaptaxReceipt: {
    deleteMany: (args: {
      where: Prisma.SnaptaxReceiptWhereInput;
    }) => Promise<{ count: number }>;
  };
  snaptaxSeasonEntitlement: {
    deleteMany: (args: {
      where: { userId: string };
    }) => Promise<{ count: number }>;
  };
  snaptaxCheckoutIntent: {
    deleteMany: (args: {
      where: { userId: string };
    }) => Promise<{ count: number }>;
  };
  snaptaxUser: {
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
};

/** DB rows for account delete — receipts, billing, then user (ghost binding cascades). */
export async function deleteUserAccountDbRecords(
  client: UserAccountDbCleanupClient,
  userId: string,
  receiptFilter: Prisma.SnaptaxReceiptWhereInput,
): Promise<UserAccountDeleteCounts> {
  const receiptResult = await client.snaptaxReceipt.deleteMany({
    where: receiptFilter,
  });
  const entitlementResult = await client.snaptaxSeasonEntitlement.deleteMany({
    where: { userId },
  });
  const checkoutResult = await client.snaptaxCheckoutIntent.deleteMany({
    where: { userId },
  });
  await client.snaptaxUser.delete({ where: { id: userId } });

  return {
    receiptCount: receiptResult.count,
    entitlementCount: entitlementResult.count,
    checkoutIntentCount: checkoutResult.count,
  };
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const binding = await prisma.snaptaxGhostAccount.findUnique({
    where: { userId },
    select: { ghostId: true },
  });
  const boundGhostId = binding?.ghostId ?? null;
  const orphanGhostIds = await listHistoricalGhostIdsForUser(userId);
  const ghostIds = [
    ...new Set(
      [boundGhostId, ...orphanGhostIds].filter(
        (ghostId): ghostId is string => ghostId != null && ghostId.length > 0,
      ),
    ),
  ];
  const receiptFilter = userAccountReceiptFilter(
    userId,
    boundGhostId,
    orphanGhostIds,
  );

  const receipts = await prisma.snaptaxReceipt.findMany({
    where: receiptFilter,
    select: { imageUrl: true },
  });
  await deleteReceiptBlobs(receipts.map((r) => r.imageUrl));

  const counts = await prisma.$transaction(async (tx) => {
    await deleteEventStoreRecords({ userId, ghostIds }, tx);
    return deleteUserAccountDbRecords(tx, userId, receiptFilter);
  });

  logEvent({
    ts: new Date().toISOString(),
    level: "info",
    module: "api.user",
    success: true,
    durationMs: 0,
    userId,
    ghostId: binding?.ghostId ?? null,
    meta: {
      reason: "account_deleted",
      receiptCount: counts.receiptCount,
      entitlementCount: counts.entitlementCount,
      checkoutIntentCount: counts.checkoutIntentCount,
    },
  });
}
