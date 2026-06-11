import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { apiError, mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";
import { currentTaxSeason } from "@/lib/tax/season";
import { irsScheduleLabel } from "@/lib/tax/irsScheduleLabel";
import type { TaxRegion } from "@/lib/tax/types";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { logEvent } from "@/lib/server/log/logEvent";
import { formatLocalDate, formatLocalDateTime } from "@/lib/format";
import { parseRequestTimeZone } from "@/lib/time/timeZone";
import { utcNow } from "@/lib/time/utc";

export const POST = withRequestLog("api.entitlement", async (request, _context) => {
  const exportStart = Date.now();
  try {
    const actor = await getActor(request);
    if (actor.kind !== "user") throw new Error("UNAUTHORIZED");

    const season = currentTaxSeason();
    const entitlement = await prisma.snaptaxSeasonEntitlement.findUnique({
      where: {
        userId_taxSeason: { userId: actor.userId, taxSeason: season },
      },
    });
    if (!entitlement) {
      return apiError("PAYMENT_REQUIRED", "Tax season export not paid", 402);
    }

    const [user, receipts] = await Promise.all([
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
    if (receipts.length === 0) {
      return apiError("NO_RECEIPTS", "No completed receipts to export", 422);
    }

    const timeZone = parseRequestTimeZone(request.headers.get("X-Time-Zone"));
    const region = (user.dataRegion ?? "us") as TaxRegion;
    const exportedAt = utcNow();

    const workbook = new ExcelJS.Workbook();
    const expenses = workbook.addWorksheet("Expenses");
    expenses.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Merchant", key: "merchant", width: 28 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Category", key: "category", width: 18 },
      { header: "Deductible", key: "deductible", width: 12 },
      { header: "Tax Saved", key: "taxAmount", width: 12 },
      { header: "IRS Schedule", key: "irsSchedule", width: 40 },
      { header: "Notes", key: "notes", width: 20 },
    ];

    let totalExpenses = 0;
    let totalDeductible = 0;
    let totalTaxSaved = 0;

    for (const r of receipts) {
      const amount = Number(r.amount ?? 0);
      const taxAmount = Number(r.taxAmount ?? 0);
      totalExpenses += amount;
      if (r.deductible) totalDeductible += amount;
      totalTaxSaved += taxAmount;

      expenses.addRow({
        date: formatLocalDate(r.snapAt ?? r.capturedAt, timeZone, region),
        merchant: r.merchantName ?? "",
        amount,
        category: r.category ?? "",
        deductible: r.deductible ? "Yes" : "No",
        taxAmount,
        irsSchedule: irsScheduleLabel(r.category ?? undefined),
        notes: "",
      });
    }

    const summary = workbook.addWorksheet("Summary");
    summary.addRow(["Tax Season", season]);
    summary.addRow(["Total Expenses", totalExpenses]);
    summary.addRow(["Est. Deductible", totalDeductible]);
    summary.addRow(["Est. Tax Saved", totalTaxSaved]);
    summary.addRow(["Industry", user.industry ?? "general"]);
    summary.addRow(["Data Region", user.dataRegion]);
    summary.addRow(["Exported At", formatLocalDateTime(exportedAt, timeZone, region)]);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Snap1099-${season}-Tax-Pack.xlsx`;

    await prisma.snaptaxReceipt.updateMany({
      where: { id: { in: receipts.map((r) => r.id) } },
      data: { taxSeason: season, taxSeasonDate: exportedAt },
    });

    logEvent({
      ts: exportedAt.toISOString(),
      level: "info",
      module: "biz.export",
      success: true,
      durationMs: Date.now() - exportStart,
      userId: actor.userId,
      meta: { taxSeason: season },
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
