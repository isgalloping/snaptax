import { syncExportFiledToServer } from "@/lib/client/exportFiledSync";
import type { ExportFiledSyncResult } from "@/lib/client/exportFiledSync";
import { markReceiptsFiledLocal } from "@/lib/client/markReceiptsFiledLocal";
import {
  buildLocalTaxPack,
  type LocalTaxPackFormat,
} from "@/lib/export/buildLocalTaxPack";
import { buildTxfExport } from "@/lib/export/buildTxf";
import { buildQboExport } from "@/lib/export/buildQboExport";
import { exportTaxPackFilename } from "@/lib/export/exportFilenames";
import type { ExportTaxPackMeta } from "@/lib/client/authApi";
import type { Receipt } from "@/lib/types";

export type RunLocalTaxExportParams = {
  receipts: Receipt[];
  taxYear: number;
  timeZone: string;
  format: LocalTaxPackFormat;
};

export type RunLocalTaxExportResult = {
  file: File;
  meta: ExportTaxPackMeta;
};

export type RunLocalTaxExportDeps = {
  syncFiled?: (params: { taxYear: string }) => Promise<ExportFiledSyncResult>;
  markFiledLocal?: typeof markReceiptsFiledLocal;
};

/** Local-first text export: build from IDB rows, then persist filed metadata server + local. */
export async function runLocalTaxExport(
  params: RunLocalTaxExportParams,
  deps: RunLocalTaxExportDeps = {},
): Promise<RunLocalTaxExportResult> {
  const taxYearStr = String(params.taxYear);
  const pack = buildLocalTaxPack(
    params.receipts,
    params.taxYear,
    params.timeZone,
    params.format,
  );

  const syncFiled = deps.syncFiled ?? syncExportFiledToServer;
  const filed = await syncFiled({ taxYear: taxYearStr });

  const markFiledLocal = deps.markFiledLocal ?? markReceiptsFiledLocal;
  await markFiledLocal({
    receiptIds: filed.receiptIds,
    taxSeason: filed.taxSeason,
    taxSeasonDate: filed.taxSeasonDate,
  });

  // Refresh TXF/QBO timestamps only — reuse the same eligible rows (no second filter path).
  let content = pack.content;
  const asOf = new Date(filed.taxSeasonDate);
  if (params.format === "txf" && pack.eligibleRows) {
    content = buildTxfExport(pack.eligibleRows, asOf);
  } else if (params.format === "qbo" && pack.eligibleRows) {
    content = buildQboExport(pack.eligibleRows, asOf);
  }

  const filename = exportTaxPackFilename(params.format, params.taxYear);
  return {
    file: new File([content], filename, { type: pack.mimeType }),
    meta: { receiptCount: filed.filedCount },
  };
}
