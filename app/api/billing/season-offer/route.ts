import { NextRequest, NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { specialPriceFlag, specialUsersFlag } from "@/flags/special";
import { formatCurrency } from "@/lib/format";
import { getSeasonOffer } from "@/lib/server/seasonOffer";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const GET = withRequestLog(
  "api.entitlement",
  async (request: NextRequest, _context) => {
    try {
      let userId: string | undefined;
      let actor = null;
      try {
        actor = await getActor(request);
        if (actor.kind === "user") {
          userId = actor.userId;
        }
      } catch {
        // Guest / ghost-only: resolve price from global seat count.
      }

      const [specialUsers, specialPriceUsd] = await Promise.all([
        specialUsersFlag(),
        specialPriceFlag(),
      ]);
      const offer = await getSeasonOffer(userId, {
        actor,
        specialUsers,
        specialPriceUsd,
      });

      return NextResponse.json({
        ...offer,
        priceLabel: offer.priceLabel ?? formatCurrency(offer.priceUsd),
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
);
