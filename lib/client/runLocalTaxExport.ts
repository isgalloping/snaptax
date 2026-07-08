import { syncExportFiledToServer } from "@/lib/client/exportFiledSync";
import { markReceiptsFiledLocal } from "@/lib/client/markReceiptsFiledLocal";
import {
  buildLocalTaxPack,
  type LocalTaxPackFormat,
} from "@/lib/export/buildLocalTaxPack";
import { buildLocalExpenseExportRows } from "@/lib/export/buildLocalExpenseRows";
import { buildTxfExport } from "@/lib/export/buildTxf";
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

/** Local-first text export: build from IDB rows, then persist filed metadata server + local. */
export async function runLocalTaxExport(
  params: RunLocalTaxExportParams,
): Promise<RunLocalTaxExportResult> {
  const pack = buildLocalTaxPack(
    params.receipts,
    params.taxYear,
    params.timeZone,
    params.format,
  );

  const filed = await syncExportFiledToServer({
    taxYear: String(params.taxYear),
  });

  await markReceiptsFiledLocal({
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
  }

  const filename = exportTaxPackFilename(params.format, params.taxYear);
  return {
    file: new File([content], filename, { type: pack.mimeType }),
    meta: { receiptCount: filed.filedCount },
  };
}
