import { syncExportFiledToServer } from "@/lib/client/exportFiledSync";
import type { ExportFiledSyncResult } from "@/lib/client/exportFiledSync";
import { markReceiptsFiledLocal } from "@/lib/client/markReceiptsFiledLocal";
import {
  buildLocalTaxPack,
  type LocalTaxPackFormat,
} from "@/lib/export/buildLocalTaxPack";
import { buildLocalExpenseExportRows } from "@/lib/export/buildLocalExpenseRows";
import { buildTxfExport } from "@/lib/export/buildTxf";
import { buildQifExport } from "@/lib/export/buildQifExport";
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

  let content = pack.content;
  if (params.format === "txf") {
    const rows = buildLocalExpenseExportRows(
      params.receipts,
      params.taxYear,
      params.timeZone,
    );
    content = buildTxfExport(rows, filed.taxSeasonDate);
  } else if (params.format === "qif") {
    const rows = buildLocalExpenseExportRows(
      params.receipts,
      params.taxYear,
      params.timeZone,
    );
    content = buildQifExport(rows);
  } else if (params.format === "qbo") {
    const rows = buildLocalExpenseExportRows(
      params.receipts,
      params.taxYear,
      params.timeZone,
    );
    content = buildQboExport(rows, new Date(filed.taxSeasonDate));
  }

  const filename = exportTaxPackFilename(params.format, params.taxYear);
  return {
    file: new File([content], filename, { type: pack.mimeType }),
    meta: { receiptCount: filed.filedCount },
  };
}
