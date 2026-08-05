import type { SnaptaxReceipt } from "@prisma/client";
import { isReceiptFiled } from "@/lib/receipts/filedStatus";

/** Server-side mirror of client done lock — filed rows are immutable except export filed metadata. */
export function assertReceiptCategoryPatchAllowed(receipt: SnaptaxReceipt): void {
  if (receipt.status !== "done") return;
  if (isReceiptFiled(receipt)) {
    throw new Error("RECEIPT_LOCKED");
  }
}

/** Block image re-upload / tax reprocessing for filed receipts. */
export function assertReceiptUploadReplaceAllowed(receipt: SnaptaxReceipt): void {
  if (isReceiptFiled(receipt)) {
    throw new Error("RECEIPT_LOCKED");
  }
}

/** Block delete for filed receipts. */
export function assertReceiptDeleteAllowed(receipt: SnaptaxReceipt): void {
  if (isReceiptFiled(receipt)) {
    throw new Error("RECEIPT_LOCKED");
  }
}
