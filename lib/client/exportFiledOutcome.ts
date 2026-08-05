import type { ExportFiledSyncResult } from "@/lib/client/exportFiledSync";

export type ApplyExportFiledSyncResult = {
  filed: ExportFiledSyncResult | null;
  filedSyncFailed: boolean;
  localFiledFailed: boolean;
};

/** Hard failures (payment, no receipts) propagate; other sync errors are non-fatal. */
export async function applyExportFiledSync(params: {
  syncFiled: (input: {
    taxYear: string;
    receiptIds: string[];
  }) => Promise<ExportFiledSyncResult>;
  markFiledLocal: (input: {
    receiptIds: string[];
    taxSeason: string;
    taxSeasonDate: Date;
  }) => Promise<void>;
  taxYear: string;
  receiptIds: string[];
}): Promise<ApplyExportFiledSyncResult> {
  try {
    const filed = await params.syncFiled({
      taxYear: params.taxYear,
      receiptIds: params.receiptIds,
    });
    try {
      await params.markFiledLocal({
        receiptIds: filed.receiptIds,
        taxSeason: filed.taxSeason,
        taxSeasonDate: filed.taxSeasonDate,
      });
    } catch {
      return { filed, filedSyncFailed: false, localFiledFailed: true };
    }
    return { filed, filedSyncFailed: false, localFiledFailed: false };
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "PAYMENT_REQUIRED" || err.message === "NO_RECEIPTS")
    ) {
      throw err;
    }
    return { filed: null, filedSyncFailed: true, localFiledFailed: false };
  }
}
