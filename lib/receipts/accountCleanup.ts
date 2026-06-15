import { del } from "@vercel/blob";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/server/log/logEvent";
import { blobCommandOptions } from "@/lib/server/blob";

export function userAccountReceiptFilter(
  userId: string,
  boundGhostId: string | null,
): Prisma.SnaptaxReceiptWhereInput {
  if (boundGhostId) {
    return {
      OR: [{ userId }, { ghostId: boundGhostId }],
    };
  }
  return { userId };
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

export async function deleteUserAccount(userId: string): Promise<void> {
  const binding = await prisma.snaptaxGhostAccount.findUnique({
    where: { userId },
    select: { ghostId: true },
  });
  const receiptFilter = userAccountReceiptFilter(
    userId,
    binding?.ghostId ?? null,
  );

  const receipts = await prisma.snaptaxReceipt.findMany({
    where: receiptFilter,
    select: { imageUrl: true },
  });
  await deleteReceiptBlobs(receipts.map((r) => r.imageUrl));

  if (receipts.length > 0) {
    await prisma.snaptaxReceipt.deleteMany({ where: receiptFilter });
  }

  await prisma.snaptaxUser.delete({ where: { id: userId } });

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
      receiptCount: receipts.length,
    },
  });
}
