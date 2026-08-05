import { syncExportFiledToServer } from "@/lib/client/exportFiledSync";
import type {
  ExportFiledSyncParams,
  ExportFiledSyncResult,
} from "@/lib/client/exportFiledSync";
import { applyExportFiledSync } from "@/lib/client/exportFiledOutcome";
import { markReceiptsFiledLocal } from "@/lib/client/markReceiptsFiledLocal";
import {
  buildLocalTaxPack,
  type LocalTaxPackFormat,
} from "@/lib/export/buildLocalTaxPack";
import { buildTxfExport } from "@/lib/export/buildTxf";
import { buildQboExport } from "@/lib/export/buildQboExport";
import { exportTaxPackFilename } from "@/lib/export/exportFilenames";
import type { ExportTaxPackMeta } from "@/lib/client/authApi";
import type { TaxRegion } from "@/lib/tax/types";
import type { Receipt } from "@/lib/types";
import { resolveExportDataRegion } from "@/lib/tax/resolveExportDataRegion";
import { exportFiledReceiptIdsForTaxYear } from "@/lib/export/exportFiledReceiptIdsForTaxYear";

export type RunLocalTaxExportParams = {
  receipts: Receipt[];
  taxYear: number;
  timeZone: string;
  format: LocalTaxPackFormat;
  dataRegion?: TaxRegion;
  userLockedRegion?: TaxRegion;
};

export type RunLocalTaxExportResult = {
  file: File;
  meta: ExportTaxPackMeta;
};

export type RunLocalTaxExportDeps = {
  syncFiled?: (params: ExportFiledSyncParams) => Promise<ExportFiledSyncResult>;
  markFiledLocal?: typeof markReceiptsFiledLocal;
};

function buildExportMeta(params: {
  packReceiptCount: number;
  filed: ExportFiledSyncResult | null;
  filedSyncFailed: boolean;
  localFiledFailed: boolean;
}): ExportTaxPackMeta {
  const meta: ExportTaxPackMeta = {
    receiptCount: params.filed?.filedCount ?? params.packReceiptCount,
  };
  if (params.filed?.skippedReceiptIds && params.filed.skippedReceiptIds > 0) {
    meta.skippedReceiptIds = params.filed.skippedReceiptIds;
  }
  if (params.filedSyncFailed) {
    meta.filedSyncFailed = true;
  }
  if (params.localFiledFailed) {
    meta.localFiledFailed = true;
  }
  return meta;
}

/** Local-first text export: build from IDB rows, then persist filed metadata server + local. */
export async function runLocalTaxExport(
  params: RunLocalTaxExportParams,
  deps: RunLocalTaxExportDeps = {},
): Promise<RunLocalTaxExportResult> {
  const taxYearStr = String(params.taxYear);
  const dataRegion = resolveExportDataRegion(
    params.receipts,
    params.dataRegion,
    params.userLockedRegion,
  );
  const pack = buildLocalTaxPack(
    params.receipts,
    params.taxYear,
    params.timeZone,
    params.format,
    { dataRegion },
  );
  const filedReceiptIds = exportFiledReceiptIdsForTaxYear(
    params.receipts,
    params.taxYear,
    params.timeZone,
  );

  const syncFiled = deps.syncFiled ?? syncExportFiledToServer;
  const markFiledLocal = deps.markFiledLocal ?? markReceiptsFiledLocal;
  const { filed, filedSyncFailed, localFiledFailed } = await applyExportFiledSync({
    syncFiled,
    markFiledLocal,
    taxYear: taxYearStr,
    receiptIds: filedReceiptIds,
  });

  let content = pack.content;
  const asOf = filed?.taxSeasonDate ?? new Date();
  if (params.format === "txf" && pack.eligibleRows) {
    content = buildTxfExport(pack.eligibleRows, asOf);
  } else if (params.format === "qbo" && pack.eligibleRows) {
    content = buildQboExport(pack.eligibleRows, asOf);
  }

  const filename = exportTaxPackFilename(params.format, params.taxYear);
  return {
    file: new File([content], filename, { type: pack.mimeType }),
    meta: buildExportMeta({
      packReceiptCount: filedReceiptIds.length,
      filed,
      filedSyncFailed,
      localFiledFailed,
    }),
  };
}
