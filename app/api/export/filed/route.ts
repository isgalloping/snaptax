import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import {
  markExportFiledForUser,
  resolveExportFiledPaymentGate,
} from "@/lib/server/exportFiled";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { parseRequestTimeZone } from "@/lib/time/timeZone";
const filedBodySchema = z.object({
  taxYear: z.string().regex(/^\d{4}$/),
  receiptIds: z.array(z.string().uuid()).min(1).optional(),
});

export const POST = withRequestLog("api.entitlement", async (request, _context) => {
  try {
    const actor = await getActor(request);
    if (actor.kind !== "user") throw new Error("UNAUTHORIZED");

    const paymentGate = await resolveExportFiledPaymentGate(actor.userId);
    if (!paymentGate.ok) {
      return apiError(paymentGate.code, paymentGate.message, paymentGate.status);
    }

    const body = filedBodySchema.parse(await request.json());
    const timeZone = parseRequestTimeZone(request.headers.get("X-Time-Zone"));
    const result = await markExportFiledForUser(
      {
        userId: actor.userId,
        taxYear: body.taxYear,
        timeZone,
        receiptIds: body.receiptIds,
      },
      undefined,
      { paidEntitlementChecked: true },
    );
    if (!result.ok) {
      return apiError(result.code, result.message, result.status);
    }

    return NextResponse.json({
      taxSeason: result.taxSeason,
      taxSeasonDate: result.taxSeasonDate.toISOString(),
      filedCount: result.filedCount,
      receiptIds: result.receiptIds,
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
