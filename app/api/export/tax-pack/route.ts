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
import {
  buildExpensesCsv,
  buildSummaryText,
  buildTurboTaxCsv,
} from "@/lib/tax/exportCsv";
import { buildCpaPackZip } from "@/lib/export/buildCpaPack";
import { buildCpaSummaryPdf } from "@/lib/export/buildCpaPdf";
import { enrichExportRowsWithImageUrls } from "@/lib/export/receiptImageUrl";
import { logEvent } from "@/lib/server/log/logEvent";
import { resolveVerifyContext } from "@/lib/verify/context";
import { ensureBypassEntitlement } from "@/lib/verify/ensureBypassEntitlement";

const exportBodySchema = z.object({
  taxYear: z.string().regex(/^\d{4}$/).optional(),
  format: z.enum(["csv", "cpa_pack", "cpa_pdf", "xlsx"]).optional().default("csv"),
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

    const [user, allReceipts] = await Promise.all([
      prisma.snaptaxUser.findUnique({
        where: { id: actor.userId },
        select: { industry: true, dataRegion: true },
      }),
      prisma.snaptaxReceipt.findMany({
        where: {
          userId: actor.userId,
          status: "done",
        },
        orderBy: { capturedAt: "asc" },
      }),
    ]);

    if (!user) throw new Error("UNAUTHORIZED");

    const timeZone = parseRequestTimeZone(request.headers.get("X-Time-Zone"));
    const region = (user.dataRegion ?? "us") as TaxRegion;
    const exportedAt = utcNow();
    const receipts = filterReceiptsByTaxYear(allReceipts, taxYearNum, timeZone);

    if (receipts.length === 0) {
      return apiError("NO_RECEIPTS", "No completed receipts to export", 422);
    }

    const rows = receipts.map((r) =>
      buildExportExpenseRow(r, timeZone, region),
    );
    const enrichedRows = await enrichExportRowsWithImageUrls(rows);
    const summaryLines = summarizeByIrsLine(enrichedRows);
    const totalExpenses = enrichedRows.reduce((sum, r) => sum + r.amount, 0);
    const totalDeductible = enrichedRows.reduce(
      (sum, r) => sum + (r.deductible ? r.deductibleAmount : 0),
      0,
    );
    const totalTaxSaved = enrichedRows.reduce((sum, r) => sum + r.taxSaved, 0);

    let buffer: Buffer | ArrayBuffer;
    let contentType: string;
    let filename: string;
    const responseHeaders: Record<string, string> = {
      "X-Export-Receipt-Count": String(enrichedRows.length),
    };

    if (body.format === "csv") {
      const csv = buildTurboTaxCsv(enrichedRows);
      buffer = Buffer.from(csv, "utf-8");
      contentType = "text/csv; charset=utf-8";
      filename = `Snap1099-${taxYear}-TurboTax-Expenses.csv`;
    } else if (body.format === "cpa_pack") {
      const csv = buildExpensesCsv(enrichedRows);
      const summaryText = buildSummaryText(taxYear, enrichedRows, summaryLines);
      const pack = await buildCpaPackZip(csv, summaryText, enrichedRows);
      buffer = pack.buffer;
      contentType = "application/zip";
      filename = `Snap1099-${taxYear}-CPA-Audit-Pack.zip`;
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
      buffer = await buildCpaSummaryPdf(taxYear, enrichedRows, summaryLines);
      contentType = "application/pdf";
      filename = `Snap1099-${taxYear}-CPA-Summary.pdf`;
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

      for (const row of enrichedRows) {
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
      where: { id: { in: receipts.map((r) => r.id) } },
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
        reason: `format=${body.format};count=${receipts.length};deductible=${totalDeductible}`,
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
