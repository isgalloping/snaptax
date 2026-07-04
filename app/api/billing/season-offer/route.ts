import { NextRequest, NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { formatCurrency } from "@/lib/format";
import { getSeasonOffer } from "@/lib/server/seasonOffer";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const GET = withRequestLog(
  "api.entitlement",
  async (request: NextRequest, _context) => {
    try {
      let userId: string | undefined;
      try {
        const actor = await getActor(request);
        if (actor.kind === "user") {
          userId = actor.userId;
        }
      } catch {
        // Guest / ghost-only: resolve price from global seat count.
      }

      const offer = await getSeasonOffer(userId);

      return NextResponse.json({
        ...offer,
        priceLabel: formatCurrency(offer.priceUsd),
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
);
