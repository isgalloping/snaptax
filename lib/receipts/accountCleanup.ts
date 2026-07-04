import { del } from "@vercel/blob";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

export async function deleteReceiptBlobs(pathnames: string[]): Promise<void> {
  if (pathnames.length === 0) return;
  try {
    await del(pathnames, blobCommandOptions());
  } catch (err) {
    logEvent({
      ts: new Date().toISOString(),
      level: "warn",
      module: "api.user",
      success: false,
      durationMs: 0,
      meta: {
        reason: "blob_delete_failed",
        pathnameCount: pathnames.length,
        errorMessage:
          err instanceof Error ? err.message.slice(0, 120) : "unknown",
      },
    });
  }
}

export async function deleteGhostReceipts(ghostId: string): Promise<void> {
  const receipts = await prisma.snaptaxReceipt.findMany({
    where: { ghostId, userId: null },
    select: { id: true, imageUrl: true },
  });
  await deleteReceiptBlobs(receipts.map((r) => r.imageUrl));
  if (receipts.length > 0) {
    await prisma.snaptaxReceipt.deleteMany({
      where: { ghostId, userId: null },
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
  const receiptGhostRows = await prisma.snaptaxReceipt.findMany({
    where: { userId, ghostId: { not: null } },
    select: { ghostId: true },
    distinct: ["ghostId"],
  });
  const historicalGhostIds = receiptGhostRows
    .map((row) => row.ghostId)
    .filter((ghostId): ghostId is string => ghostId != null);
  const receiptFilter = userAccountReceiptFilter(
    userId,
    boundGhostId,
    historicalGhostIds,
  );

  const receipts = await prisma.snaptaxReceipt.findMany({
    where: receiptFilter,
    select: { imageUrl: true },
  });
  await deleteReceiptBlobs(receipts.map((r) => r.imageUrl));

  const counts = await prisma.$transaction((tx) =>
    deleteUserAccountDbRecords(tx, userId, receiptFilter),
  );

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
