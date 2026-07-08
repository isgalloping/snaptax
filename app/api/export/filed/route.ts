import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";
import { userAccountReceiptFilter } from "@/lib/receipts/accountCleanup";
import { assertPersistedReceiptId } from "@/lib/receipts/receiptId";
import { assertReceiptsMatchExportTaxYear } from "@/lib/receipts/validateExportFiledReceipts";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { logEvent } from "@/lib/server/log/logEvent";
import { currentTaxSeason } from "@/lib/tax/season";
import { parseRequestTimeZone } from "@/lib/time/timeZone";
import { utcNow } from "@/lib/time/utc";
import { ensureBypassEntitlement } from "@/lib/verify/ensureBypassEntitlement";
import { resolveVerifyContext } from "@/lib/verify/context";

const filedBodySchema = z.object({
  taxYear: z.string().regex(/^\d{4}$/),
  receiptIds: z.array(z.string().uuid()).min(1),
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

    const body = filedBodySchema.parse(await request.json());
    for (const id of body.receiptIds) {
      assertPersistedReceiptId(id);
    }

    const binding = await prisma.snaptaxGhostAccount.findUnique({
      where: { userId: actor.userId },
      select: { ghostId: true },
    });

    const owned = await prisma.snaptaxReceipt.findMany({
      where: {
        id: { in: body.receiptIds },
        ...userAccountReceiptFilter(actor.userId, binding?.ghostId ?? null),
        status: "done",
      },
    });
    if (owned.length !== body.receiptIds.length) {
      return apiError("NOT_FOUND", "One or more receipts not found", 404);
    }

    const timeZone = parseRequestTimeZone(request.headers.get("X-Time-Zone"));
    const taxYearNum = Number(body.taxYear);
    assertReceiptsMatchExportTaxYear({
      receipts: owned,
      receiptIds: body.receiptIds,
      taxYear: taxYearNum,
      timeZone,
    });

    const exportedAt = utcNow();
    const result = await prisma.snaptaxReceipt.updateMany({
      where: { id: { in: body.receiptIds } },
      data: { taxSeason: body.taxYear, taxSeasonDate: exportedAt },
    });

    logEvent({
      ts: exportedAt.toISOString(),
      module: "biz.export",
      level: "info",
      success: true,
      durationMs: 0,
      userId: actor.userId,
      meta: {
        taxSeason: body.taxYear,
        receiptCount: result.count,
        reason: "local_export_filed",
      },
    });

    return NextResponse.json({
      taxSeason: body.taxYear,
      taxSeasonDate: exportedAt.toISOString(),
      filedCount: result.count,
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
