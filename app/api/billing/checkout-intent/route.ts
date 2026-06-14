import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { createOrReuseCheckoutIntent } from "@/lib/billing/checkoutIntent";
import { currentTaxSeason } from "@/lib/tax/season";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

const bodySchema = z.object({
  taxSeason: z.string().min(1).optional(),
});

export const POST = withRequestLog(
  "api.billing",
  async (request: NextRequest, _context) => {
    try {
      const actor = await getActor(request);
      if (actor.kind !== "user") throw new Error("UNAUTHORIZED");

      const raw = await request.json().catch(() => ({}));
      const body = bodySchema.parse(raw);
      const taxSeason = body.taxSeason ?? currentTaxSeason();

      const { intentId, expiresAt } = await createOrReuseCheckoutIntent(
        actor.userId,
        taxSeason,
      );

      return NextResponse.json({
        intentId,
        taxSeason,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
);
