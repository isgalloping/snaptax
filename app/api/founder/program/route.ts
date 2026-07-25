import { NextResponse } from "next/server";
import { specialPriceFlag, specialUsersFlag } from "@/flags/special";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { resolveSpecialCheckoutEligible } from "@/lib/billing/specialCheckout";
import { formatCurrency } from "@/lib/format";
import { getFounderProgramState } from "@/lib/server/founderProgram";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const GET = withRequestLog("api.entitlement", async (request, _context) => {
  try {
    const actor = await getActor(request);
    const userId = actor.kind === "user" ? actor.userId : undefined;
    const [specialUsers, specialPriceUsd] = await Promise.all([
      specialUsersFlag(),
      specialPriceFlag(),
    ]);
    const state = await getFounderProgramState(userId);
    const internalTestCheckout =
      actor.kind === "user" &&
      resolveSpecialCheckoutEligible(actor, specialUsers, specialPriceUsd);

    return NextResponse.json({
      ...state,
      ...(internalTestCheckout
        ? {
            internalTestCheckout: true,
            internalTestPriceLabel: formatCurrency(specialPriceUsd),
          }
        : {}),
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
