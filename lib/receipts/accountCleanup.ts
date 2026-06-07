import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { blobCommandOptions } from "@/lib/server/blob";

export async function deleteReceiptBlobs(pathnames: string[]): Promise<void> {
  if (pathnames.length === 0) return;
  try {
    await del(pathnames, blobCommandOptions());
  } catch {
    // Blob may already be gone; continue DB cleanup
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
  const receipts = await prisma.snaptaxReceipt.findMany({
    where: { userId },
    select: { imageUrl: true },
  });
  await deleteReceiptBlobs(receipts.map((r) => r.imageUrl));
  await prisma.snaptaxUser.delete({ where: { id: userId } });
}
