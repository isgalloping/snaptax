import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";
import { currentTaxSeason, defaultExportTaxYear } from "@/lib/tax/season";
import type { TaxRegion } from "@/lib/tax/types";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { formatLocalDateTime } from "@/lib/format";
import { parseRequestTimeZone } from "@/lib/time/timeZone";
import { utcNow } from "@/lib/time/utc";
import {
  buildExportExpenseRow,
  filterReceiptsByTaxYear,
  summarizeByIrsLine,
} from "@/lib/tax/exportRows";
import { buildTurboTaxCsv } from "@/lib/tax/exportCsv";
import { buildCpaPackZip } from "@/lib/export/buildCpaPack";
import { buildScheduleCMirrorPdf } from "@/lib/export/buildScheduleCMirrorPdf";
import { buildAuditDetailCsv } from "@/lib/export/buildAuditDetailCsv";
import { auditEligibleRows, hasAuditExportContent } from "@/lib/export/auditEligibleRows";
import { assignAuditTrailMeta } from "@/lib/export/assignAuditTrailMeta";
import { buildTxfExport } from "@/lib/export/buildTxf";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";
import {
  buildExportIncomeRow,
  isIncomeDocument,
} from "@/lib/export/incomeDocuments";
import { logEvent } from "@/lib/server/log/logEvent";
import { resolveVerifyContext } from "@/lib/verify/context";
import { ensureBypassEntitlement } from "@/lib/verify/ensureBypassEntitlement";
import { userAccountReceiptFilter } from "@/lib/receipts/accountCleanup";

export const maxDuration = 60;

const exportBodySchema = z.object({
  taxYear: z.string().regex(/^\d{4}$/).optional(),
  format: z
    .enum(["csv", "cpa_pack", "cpa_pdf", "txf", "xlsx"])
    .optional()
    .default("csv"),
});

export const POST = withRequestLog("api.entitlement", async (request, _context) => {
  try {
    const actor = await getActor(request);
    if (actor.kind !== "user") throw new Error("UNAUTHORIZED");

    const season = currentTaxSeason();
    const verify = await resolveVerifyContext(actor);
    if (verify.canBypassPay) {
      await ensureBypassEntitlement(actor.userId, season);
    }
    const entitlement = await prisma.snaptaxSeasonEntitlement.findUnique({
      where: {
        userId_taxSeason: { userId: actor.userId, taxSeason: season },
      },
    });
    if (!entitlement) {
      return apiError("PAYMENT_REQUIRED", "Tax season export not paid", 402);
    }

    const rawBody = await request.json().catch(() => ({}));
    const body = exportBodySchema.parse(rawBody);
    const taxYear = body.taxYear ?? defaultExportTaxYear();
    const taxYearNum = Number(taxYear);

    const [user, binding] = await Promise.all([
      prisma.snaptaxUser.findUnique({
        where: { id: actor.userId },
        select: { industry: true, dataRegion: true, userName: true },
      }),
      prisma.snaptaxGhostAccount.findUnique({
        where: { userId: actor.userId },
        select: { ghostId: true },
      }),
    ]);

    if (!user) throw new Error("UNAUTHORIZED");

    const allReceipts = await prisma.snaptaxReceipt.findMany({
      where: {
        ...userAccountReceiptFilter(
          actor.userId,
          binding?.ghostId ?? null,
        ),
        status: "done",
      },
      orderBy: { capturedAt: "asc" },
    });

    const timeZone = parseRequestTimeZone(request.headers.get("X-Time-Zone"));
    const region = (user.dataRegion ?? "us") as TaxRegion;
    const exportedAt = utcNow();
    const yearReceipts = filterReceiptsByTaxYear(allReceipts, taxYearNum, timeZone);

    if (yearReceipts.length === 0) {
      return apiError("NO_RECEIPTS", "No completed receipts to export", 422);
    }

    const incomeReceipts = yearReceipts.filter((r) => isIncomeDocument(r));
    const expenseReceipts = yearReceipts.filter((r) => !isIncomeDocument(r));

    const incomeRows = incomeReceipts
      .map((r) => buildExportIncomeRow(r, timeZone))
      .filter((row): row is NonNullable<typeof row> => row != null);

    const expenseRows = expenseReceipts.map((r) =>
      buildExportExpenseRow(r, timeZone, region),
    );
    const enrichedExpenseRows = finalizeExportRows(expenseRows);
    const auditRows = assignAuditTrailMeta(
      auditEligibleRows(enrichedExpenseRows),
    );
    const summaryLines = summarizeByIrsLine(enrichedExpenseRows);
    const totalExpenses = enrichedExpenseRows.reduce((sum, r) => sum + r.amount, 0);
    const totalDeductible = enrichedExpenseRows.reduce(
      (sum, r) => sum + (r.deductible ? r.deductibleAmount : 0),
      0,
    );
    const totalTaxSaved = enrichedExpenseRows.reduce((sum, r) => sum + r.taxSaved, 0);

    let buffer: Buffer | ArrayBuffer;
    let contentType: string;
    let filename: string;
    const responseHeaders: Record<string, string> = {
      "X-Export-Receipt-Count": String(yearReceipts.length),
    };

    if (body.format === "cpa_pack" || body.format === "cpa_pdf") {
      if (!hasAuditExportContent(auditRows, incomeRows)) {
        return apiError(
          "NO_RECEIPTS",
          "No tax-deductible receipts or 1099 income forms to export",
          422,
        );
      }
    }

    if (body.format === "csv") {
      if (enrichedExpenseRows.length === 0) {
        return apiError(
          "NO_RECEIPTS",
          "No expense receipts to export for TurboTax CSV",
          422,
        );
      }
      const csv = buildTurboTaxCsv(enrichedExpenseRows);
      buffer = Buffer.from(csv, "utf-8");
      contentType = "text/csv; charset=utf-8";
      filename = `Snap1099-${taxYear}-TurboTax-Expenses.csv`;
    } else if (body.format === "txf") {
      if (enrichedExpenseRows.length === 0) {
        return apiError(
          "NO_RECEIPTS",
          "No expense receipts to export for TXF",
          422,
        );
      }
      const txf = buildTxfExport(enrichedExpenseRows, exportedAt);
      buffer = Buffer.from(txf, "utf-8");
      contentType = "text/plain; charset=utf-8";
      filename = `Snap1099-${taxYear}-Expenses.txf`;
    } else if (body.format === "cpa_pack") {
      const detailCsv = buildAuditDetailCsv(auditRows);
      const summaryPdf = await buildScheduleCMirrorPdf({
        taxYear,
        taxpayerName: user.userName ?? "SnapTax User",
        businessIndustry: "Independent Contractor",
        auditRows,
        incomeRows,
      });
      const pack = await buildCpaPackZip(
        detailCsv,
        summaryPdf,
        auditRows,
        incomeRows,
        taxYear,
      );
      buffer = pack.buffer;
      contentType = "application/zip";
      filename = `Snap1099-${taxYear}-Audit-Trail.zip`;
      responseHeaders["X-Export-Images-Included"] = String(
        pack.imageStats.imagesIncluded,
      );
      responseHeaders["X-Export-Images-Eligible"] = String(
        pack.imageStats.imagesEligible,
      );
      responseHeaders["X-Export-Images-Missing"] = String(
        pack.imageStats.imagesEligible - pack.imageStats.imagesIncluded,
      );
    } else if (body.format === "cpa_pdf") {
      try {
        buffer = await buildScheduleCMirrorPdf({
          taxYear,
          taxpayerName: user.userName ?? "SnapTax User",
          businessIndustry: "Independent Contractor",
          auditRows,
          incomeRows,
        });
      } catch (pdfErr) {
        logEvent({
          ts: utcNow().toISOString(),
          module: "biz.export",
          level: "error",
          success: false,
          durationMs: 0,
          userId: actor.userId,
          meta: {
            taxSeason: taxYear,
            reason: `pdf_generation_failed;count=${yearReceipts.length}`,
            errorMessage:
              pdfErr instanceof Error ? pdfErr.message.slice(0, 120) : "unknown",
          },
        });
        throw new Error("PDF_GENERATION_FAILED");
      }
      contentType = "application/pdf";
      filename = `Snap1099-${taxYear}-Schedule-C-Mirror.pdf`;
    } else if (body.format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const expenses = workbook.addWorksheet("Expenses");
      expenses.columns = [
        { header: "Date", key: "date", width: 14 },
        { header: "Merchant", key: "merchant", width: 28 },
        { header: "Amount", key: "amount", width: 12 },
        { header: "Category", key: "category", width: 18 },
        { header: "IRS Schedule Line", key: "irsLine", width: 18 },
        { header: "IRS Schedule", key: "irsSchedule", width: 40 },
        { header: "Deductible Amount", key: "deductibleAmount", width: 16 },
        { header: "Deductible", key: "deductible", width: 12 },
        { header: "Tax Saved", key: "taxAmount", width: 12 },
        { header: "Notes", key: "notes", width: 24 },
        { header: "Receipt ID", key: "id", width: 38 },
      ];

      for (const row of enrichedExpenseRows) {
        expenses.addRow({
          date: row.date,
          merchant: row.merchant,
          amount: row.amount,
          category: row.category,
          irsLine: row.irsLine,
          irsSchedule: row.irsSchedule,
          deductibleAmount: row.deductibleAmount,
          deductible: row.deductible ? "Yes" : "No",
          taxAmount: row.taxSaved,
          notes: row.notes,
          id: row.id,
        });
      }

      const summary = workbook.addWorksheet("Summary");
      summary.addRow(["Tax Year", taxYear]);
      summary.addRow(["Total Expenses", totalExpenses]);
      summary.addRow(["Est. Deductible", totalDeductible]);
      summary.addRow(["Est. Tax Saved", totalTaxSaved]);
      summary.addRow(["Industry", user.industry ?? "general"]);
      summary.addRow(["Data Region", user.dataRegion]);
      summary.addRow([
        "Exported At",
        formatLocalDateTime(exportedAt, timeZone, region),
      ]);
      for (const line of summaryLines) {
        summary.addRow([line.line, line.total]);
      }

      buffer = await workbook.xlsx.writeBuffer();
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      filename = `Snap1099-${taxYear}-Tax-Pack.xlsx`;
    } else {
      throw new Error("UNSUPPORTED_EXPORT_FORMAT");
    }

    await prisma.snaptaxReceipt.updateMany({
      where: { id: { in: yearReceipts.map((r) => r.id) } },
      data: { taxSeason: taxYear, taxSeasonDate: exportedAt },
    });

    logEvent({
      ts: exportedAt.toISOString(),
      module: "biz.export",
      level: "info",
      success: true,
      durationMs: 0,
      userId: actor.userId,
      meta: {
        taxSeason: taxYear,
        reason: `format=${body.format};count=${yearReceipts.length};deductible=${totalDeductible};income=${incomeRows.length}`,
      },
    });

    const bodyBytes =
      buffer instanceof Buffer ? new Uint8Array(buffer) : new Uint8Array(buffer);

    return new NextResponse(bodyBytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...responseHeaders,
      },
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
