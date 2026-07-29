import { NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { isSeasonEntitlementPaid } from "@/lib/billing/isSeasonEntitlementPaid";
import { prisma } from "@/lib/prisma";
import { currentTaxSeason } from "@/lib/tax/season";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const GET = withRequestLog("api.entitlement", async (request, _context) => {
  try {
    const actor = await getActor(request);
    if (actor.kind !== "user") throw new Error("UNAUTHORIZED");

    const season =
      new URL(request.url).searchParams.get("season") ?? currentTaxSeason();

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
