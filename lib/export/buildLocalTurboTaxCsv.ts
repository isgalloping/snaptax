import type { Receipt } from "@/lib/types";
import type { SnaptaxReceipt } from "@prisma/client";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";
import { buildTurboTaxCsv } from "@/lib/tax/exportCsv";
import {
  buildExportExpenseRow,
  filterReceiptsByTaxYear,
} from "@/lib/tax/exportRows";

function toSnaptaxReceipt(receipt: Receipt): SnaptaxReceipt {
  return {
    id: receipt.id,
    userId: "",
    ghostId: null,
    imageUrl: receipt.imageUrl?.trim() || "",
    status: "done",
    amount: (receipt.amount ?? 0) as SnaptaxReceipt["amount"],
    currency: receipt.currency ?? "USD",
    merchantName: receipt.merchant ?? "",
    category: receipt.category ?? null,
    deductible: receipt.deductible ?? false,
    taxAmount: (receipt.taxAmount ?? 0) as SnaptaxReceipt["taxAmount"],
    dataRegion: receipt.dataRegion ?? "us",
    aiRaw: { deduction_ratio: 1 },
    capturedAt: receipt.timestamp,
    snapAt: receipt.timestamp,
    processedAt: null,
    taxSeason: receipt.taxSeason ?? null,
    taxSeasonDate: receipt.taxSeasonDate ?? null,
    contentSha256: "",
    imageFingerprint: "",
    createdAt: receipt.timestamp,
    updatedAt: receipt.updatedAt ?? receipt.timestamp,
  };
}

/**
 * Client-side TurboTax CSV preview (no signed image URLs).
 * Uses the same column layout as server export after finalizeExportRows.
 */
export function buildLocalTurboTaxCsv(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
): string {
  const snaptaxReceipts = receipts
    .filter((r) => r.status === "done")
    .map(toSnaptaxReceipt);
  const filtered = filterReceiptsByTaxYear(
    snaptaxReceipts,
    taxYear,
    timeZone,
  );
  const rows = filtered.map((r) =>
    buildExportExpenseRow(r, timeZone, "us"),
  );
  return buildTurboTaxCsv(finalizeExportRows(rows));
}
