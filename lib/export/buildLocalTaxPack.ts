import { buildTxfExport } from "@/lib/export/buildTxf";
import { buildQifExport } from "@/lib/export/buildQifExport";
import { buildQboExport } from "@/lib/export/buildQboExport";
import { exportEligibleRows } from "@/lib/export/auditEligibleRows";
import { buildLocalExpenseExportRows } from "@/lib/export/buildLocalExpenseRows";
import { buildTurboTaxCsv } from "@/lib/tax/exportCsv";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import type { Receipt } from "@/lib/types";

export type LocalTaxPackFormat = "csv" | "txf" | "qif" | "qbo";

export type LocalTaxPackResult = {
  content: string;
  receiptIds: string[];
  mimeType: string;
  /** Eligible expense rows used for the pack (txf/qif/qbo); for date-stamp refresh. */
  eligibleRows?: ExportExpenseRow[];
};

export type BuildLocalTaxPackOptions = {
  /** TXF header / QBO DTSERVER as-of (defaults to now). */
  exportedAt?: Date;
};

/** Build text export packs from local IDB receipt rows (no server PG read). */
export function buildLocalTaxPack(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
  format: LocalTaxPackFormat,
  options: BuildLocalTaxPackOptions = {},
): LocalTaxPackResult {
  const rows = buildLocalExpenseExportRows(receipts, taxYear, timeZone);
  const receiptIds = rows.map((row) => row.id);
  const exportedAt = options.exportedAt ?? new Date();

  if (format === "csv") {
    if (rows.length === 0) {
      throw new Error("NO_RECEIPTS");
    }
    return {
      content: buildTurboTaxCsv(rows),
      receiptIds,
      mimeType: "text/csv;charset=utf-8",
    };
  }

  if (format === "txf" || format === "qif" || format === "qbo") {
    const eligible = exportEligibleRows(rows);
    if (eligible.length === 0) {
      throw new Error("NO_RECEIPTS");
    }
    const eligibleIds = eligible.map((row) => row.id);
    if (format === "txf") {
      return {
        content: buildTxfExport(eligible, exportedAt),
        receiptIds: eligibleIds,
        mimeType: "text/plain;charset=utf-8",
        eligibleRows: eligible,
      };
    }
    if (format === "qif") {
      return {
        content: buildQifExport(eligible),
        receiptIds: eligibleIds,
        mimeType: "application/qif;charset=utf-8",
        eligibleRows: eligible,
      };
    }
    return {
      content: buildQboExport(eligible, exportedAt),
      receiptIds: eligibleIds,
      mimeType: "application/x-ofx;charset=utf-8",
      eligibleRows: eligible,
    };
  }

  throw new Error("UNSUPPORTED_EXPORT_FORMAT");
}
