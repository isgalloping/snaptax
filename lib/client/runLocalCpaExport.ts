import { syncExportFiledToServer } from "@/lib/client/exportFiledSync";
import type { ExportFiledSyncResult } from "@/lib/client/exportFiledSync";
import { markReceiptsFiledLocal } from "@/lib/client/markReceiptsFiledLocal";
import { resolveExportReceiptImageBlob } from "@/lib/client/resolveExportReceiptImage";
import { buildAuditDetailCsv } from "@/lib/export/buildAuditDetailCsv";
import { buildLocalCpaExportContext } from "@/lib/export/buildLocalCpaExportContext";
import { hasAuditExportContent } from "@/lib/export/auditEligibleRows";
import { exportTaxPackFilename } from "@/lib/export/exportFilenames";
import type { ExportTaxPackMeta } from "@/lib/client/authApi";
import type { ScheduleCMirrorPdfInput } from "@/lib/export/buildScheduleCMirrorPdf";
import type { LocalCpaPackProgress } from "@/lib/export/buildLocalCpaPackZip";
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
  onPackProgress?: (progress: LocalCpaPackProgress) => void;
};

export type RunLocalCpaExportResult = {
  file: File;
  meta: ExportTaxPackMeta;
};

export type RunLocalCpaExportDeps = {
  buildPdf?: (input: ScheduleCMirrorPdfInput) => Promise<Uint8Array>;
  buildPack?: typeof import("@/lib/export/buildLocalCpaPackZip").buildLocalCpaPackZip;
  resolveImage?: typeof resolveExportReceiptImageBlob;
  syncFiled?: (params: { taxYear: string }) => Promise<ExportFiledSyncResult>;
  markFiledLocal?: typeof markReceiptsFiledLocal;
};

async function defaultBuildPdf(
  input: ScheduleCMirrorPdfInput,
): Promise<Uint8Array> {
  const { buildBrowserScheduleCMirrorPdf } = await import(
    "@/lib/export/buildBrowserScheduleCMirrorPdf"
  );
  return buildBrowserScheduleCMirrorPdf(input);
}

async function defaultBuildPack(
  ...args: Parameters<
    typeof import("@/lib/export/buildLocalCpaPackZip").buildLocalCpaPackZip
  >
) {
  const { buildLocalCpaPackZip } = await import(
    "@/lib/export/buildLocalCpaPackZip"
  );
  return buildLocalCpaPackZip(...args);
}

/** Local-first CPA export: build PDF/ZIP from IDB, then filed sync server + local. */
export async function runLocalCpaExport(
  params: RunLocalCpaExportParams,
  deps: RunLocalCpaExportDeps = {},
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

  const buildPdf = deps.buildPdf ?? defaultBuildPdf;
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await buildPdf({
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
    const buildPack = deps.buildPack ?? defaultBuildPack;
    const resolveImage = deps.resolveImage ?? resolveExportReceiptImageBlob;
    const detailCsv = buildAuditDetailCsv(ctx.auditRows);
    const pack = await buildPack(
      detailCsv,
      pdfBytes,
      ctx.auditRows,
      ctx.incomeRows,
      taxYearStr,
      async (receiptId) => {
        const resolved = await resolveImage(receiptId);
        return resolved?.blob ?? null;
      },
      params.onPackProgress,
    );
    mimeType = "application/zip";
    blob = new Blob(pack.chunks as BlobPart[], { type: mimeType });
    imageStats = pack.imageStats;
  }

  const syncFiled = deps.syncFiled ?? syncExportFiledToServer;
  const filed = await syncFiled({ taxYear: taxYearStr });

  const markFiledLocal = deps.markFiledLocal ?? markReceiptsFiledLocal;
  await markFiledLocal({
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
