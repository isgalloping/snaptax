import { NextRequest, NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { verfyUserFlag } from "@/flags/verify";
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

      const verfyUser = await verfyUserFlag();
      const offer = await getSeasonOffer(userId, { actor, verfyUser });

      return NextResponse.json({
        ...offer,
        priceLabel:
          offer.priceLabel ??
          (offer.priceDisplay === "internal_test"
            ? offer.priceLabel
            : formatCurrency(offer.priceUsd)),
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
);
