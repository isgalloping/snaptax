import { NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { isSeasonEntitlementPaid } from "@/lib/billing/isSeasonEntitlementPaid";
import { prisma } from "@/lib/prisma";
import { currentTaxSeason } from "@/lib/tax/season";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { resolveVerifyContext } from "@/lib/verify/context";
import { ensureBypassEntitlement } from "@/lib/verify/ensureBypassEntitlement";
import { logEvent } from "@/lib/server/log/logEvent";
import { baseLogEntry } from "@/lib/server/log/context";

export const GET = withRequestLog("api.entitlement", async (request, _context) => {
  try {
    const actor = await getActor(request);
    if (actor.kind !== "user") throw new Error("UNAUTHORIZED");

    const season =
      new URL(request.url).searchParams.get("season") ?? currentTaxSeason();

    const verify = await resolveVerifyContext(actor);
    if (verify.canBypassPay) {
      const created = await ensureBypassEntitlement(actor.userId, season);
      if (created || verify.canBypass) {
        logEvent({
          ...baseLogEntry("biz.verify", request, actor),
          level: "info",
          success: true,
          durationMs: 0,
          meta: {
            verifyBypass: true,
            bypassPay: true,
            taxSeason: season,
          },
        });
      }
    }

    const entitlement = await prisma.snaptaxSeasonEntitlement.findUnique({
      where: {
        userId_taxSeason: { userId: actor.userId, taxSeason: season },
      },
    });

    return NextResponse.json({
      season,
      paid: isSeasonEntitlementPaid(entitlement?.status),
      paidAt: entitlement?.paidAt.toISOString() ?? null,
      status: entitlement?.status ?? null,
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
