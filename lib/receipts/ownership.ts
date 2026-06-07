import type { SnaptaxReceipt } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";

export function assertReceiptAccess(receipt: SnaptaxReceipt, actor: Actor): void {
  if (actor.kind === "user") {
    if (receipt.userId !== actor.userId) throw new Error("NOT_FOUND");
    return;
  }
  if (receipt.userId != null) throw new Error("NOT_FOUND");
  if (receipt.ghostId !== actor.ghostId) throw new Error("NOT_FOUND");
}

export function receiptWhereForActor(actor: Actor) {
  if (actor.kind === "user") {
    return { userId: actor.userId };
  }
  return { ghostId: actor.ghostId, userId: null };
}
