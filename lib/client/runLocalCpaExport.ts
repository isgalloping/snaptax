import { syncExportFiledToServer } from "@/lib/client/exportFiledSync";
import { markReceiptsFiledLocal } from "@/lib/client/markReceiptsFiledLocal";
import { resolveExportReceiptImageBlob } from "@/lib/client/resolveExportReceiptImage";
import { buildAuditDetailCsv } from "@/lib/export/buildAuditDetailCsv";
import { buildBrowserScheduleCMirrorPdf } from "@/lib/export/buildBrowserScheduleCMirrorPdf";
import { buildLocalCpaExportContext } from "@/lib/export/buildLocalCpaExportContext";
import { buildLocalCpaPackZip } from "@/lib/export/buildLocalCpaPackZip";
import { hasAuditExportContent } from "@/lib/export/auditEligibleRows";
import { exportTaxPackFilename } from "@/lib/export/exportFilenames";
import type { ExportTaxPackMeta } from "@/lib/client/authApi";
import type { TaxRegion } from "@/lib/tax/types";
import type { Receipt } from "@/lib/types";

export type LocalCpaExportFormat = "cpa_pdf" | "cpa_pack";

export type RunLocalCpaExportParams = {
  receipts: Receipt[];
  taxYear: number;
  timeZone: string;
  format: LocalCpaExportFormat;
  taxpayerName?: string;
  dataRegion?: TaxRegion;
};

export type RunLocalCpaExportResult = {
  file: File;
  meta: ExportTaxPackMeta;
};

/** Local-first CPA export: build PDF/ZIP from IDB, then filed sync server + local. */
export async function runLocalCpaExport(
  params: RunLocalCpaExportParams,
): Promise<RunLocalCpaExportResult> {
  const taxYearStr = String(params.taxYear);
  const ctx = buildLocalCpaExportContext(
    params.receipts,
    params.taxYear,
    params.timeZone,
    params.dataRegion ?? "us",
  );

  if (!hasAuditExportContent(ctx.auditRows, ctx.incomeRows)) {
    throw new Error("NO_RECEIPTS");
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await buildBrowserScheduleCMirrorPdf({
      taxYear: taxYearStr,
      taxpayerName: params.taxpayerName ?? "SnapTax User",
      businessIndustry: "Independent Contractor",
      auditRows: ctx.auditRows,
      incomeRows: ctx.incomeRows,
    });
  } catch {
    throw new Error("PDF_GENERATION_FAILED");
  }

  let blob: Blob;
  let mimeType: string;
  let imageStats: { imagesIncluded: number; imagesEligible: number } | null =
    null;

  if (params.format === "cpa_pdf") {
    mimeType = "application/pdf";
    blob = new Blob([pdfBytes.slice()], { type: mimeType });
  } else {
    const detailCsv = buildAuditDetailCsv(ctx.auditRows);
    const pack = await buildLocalCpaPackZip(
      detailCsv,
      pdfBytes,
      ctx.auditRows,
      ctx.incomeRows,
      taxYearStr,
      async (receiptId) => {
        const resolved = await resolveExportReceiptImageBlob(receiptId);
        return resolved?.blob ?? null;
      },
    );
    mimeType = "application/zip";
    blob = new Blob([pack.buffer.slice()], { type: mimeType });
    imageStats = pack.imageStats;
  }

  const filed = await syncExportFiledToServer({
    taxYear: taxYearStr,
  });

  await markReceiptsFiledLocal({
    receiptIds: filed.receiptIds,
    taxSeason: filed.taxSeason,
    taxSeasonDate: filed.taxSeasonDate,
  });

  const filename = exportTaxPackFilename(params.format, params.taxYear);
  const meta: ExportTaxPackMeta = { receiptCount: filed.filedCount };
  if (imageStats) {
    meta.imagesIncluded = imageStats.imagesIncluded;
    meta.imagesEligible = imageStats.imagesEligible;
    meta.imagesMissing = imageStats.imagesEligible - imageStats.imagesIncluded;
  }

  return {
    file: new File([blob], filename, { type: mimeType }),
    meta,
  };
}
