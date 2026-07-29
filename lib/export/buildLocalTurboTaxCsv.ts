import { buildLocalExpenseExportRows } from "@/lib/export/buildLocalExpenseRows";
import { buildTurboTaxCsv } from "@/lib/tax/exportCsv";
import type { Receipt } from "@/lib/types";

/**
 * Client-side TurboTax CSV preview (no signed image URLs).
 * Uses the same column layout as server export after finalizeExportRows.
 */
export function buildLocalTurboTaxCsv(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
): string {
  const rows = buildLocalExpenseExportRows(receipts, taxYear, timeZone);
  return buildTurboTaxCsv(rows);
}
