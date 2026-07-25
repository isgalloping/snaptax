import { NextResponse } from "next/server";
import { verfyUserFlag } from "@/flags/verify";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import {
  resolveSpecialCheckoutEligible,
  SPECIAL_PRICE_LABEL,
} from "@/lib/billing/specialCheckout";
import { getFounderProgramState } from "@/lib/server/founderProgram";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const GET = withRequestLog("api.entitlement", async (request, _context) => {
  try {
    const actor = await getActor(request);
    const userId = actor.kind === "user" ? actor.userId : undefined;
    const verfyUser = await verfyUserFlag();
    const state = await getFounderProgramState(userId);
    const internalTestCheckout =
      actor.kind === "user" && resolveSpecialCheckoutEligible(actor, verfyUser);

    return NextResponse.json({
      ...state,
      ...(internalTestCheckout
        ? {
            internalTestCheckout: true,
            internalTestPriceLabel: SPECIAL_PRICE_LABEL,
          }
        : {}),
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
