import type { SnaptaxReceipt } from "@prisma/client";
import { isReceiptFiled } from "@/lib/receipts/filedStatus";

/** Server-side mirror of client done lock — filed rows are immutable except export filed metadata. */
export function assertReceiptCategoryPatchAllowed(receipt: SnaptaxReceipt): void {
  if (receipt.status !== "done") return;
  if (isReceiptFiled(receipt)) {
    throw new Error("RECEIPT_LOCKED");
  }
}
