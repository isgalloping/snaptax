import { syncExportFiledToServer } from "@/lib/client/exportFiledSync";
import { markReceiptsFiledLocal } from "@/lib/client/markReceiptsFiledLocal";
import {
  buildLocalTaxPack,
  type LocalTaxPackFormat,
} from "@/lib/export/buildLocalTaxPack";
import { exportTaxPackFilename } from "@/lib/export/exportFilenames";
import type { ExportTaxPackMeta } from "@/lib/client/authApi";
import { receiptsInTaxYear } from "@/lib/tax/taxYearStats";
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

  const filedReceiptIds = receiptsInTaxYear(
    params.receipts,
    params.taxYear,
    params.timeZone,
  ).map((r) => r.id);

  const filed = await syncExportFiledToServer({
    taxYear: String(params.taxYear),
    receiptIds: filedReceiptIds,
  });

  await markReceiptsFiledLocal({
    receiptIds: filedReceiptIds,
    taxSeason: filed.taxSeason,
    taxSeasonDate: filed.taxSeasonDate,
  });

  const filename = exportTaxPackFilename(params.format, params.taxYear);
  return {
    file: new File([pack.content], filename, { type: pack.mimeType }),
    meta: { receiptCount: filedReceiptIds.length },
  };
}
