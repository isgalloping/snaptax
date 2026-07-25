import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { createOrReuseCheckoutIntent } from "@/lib/billing/checkoutIntent";
import { resolveCheckoutSkuTier } from "@/lib/billing/resolveCheckoutSkuTier";
import { verfyUserFlag } from "@/flags/verify";
import type { PublicFounderTier } from "@/lib/founder/types";
import { resolveFounderProgramConfig } from "@/lib/server/founderConfig";
import { getFounderProgramState } from "@/lib/server/founderProgram";
import { getPaddlePriceIdSpecial } from "@/lib/server/env";
import { currentTaxSeason } from "@/lib/tax/season";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

const founderTierSchema = z.enum([
  "FOUNDER_LEVEL_SUPER",
  "EARLY",
  "FOUNDER",
  "DEFAULT",
  "SPECIAL",
]);

const bodySchema = z.object({
  taxSeason: z.string().min(1).optional(),
  skuTier: founderTierSchema.optional(),
  founderPurchase: z.boolean().optional(),
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

      const verfyUser = await verfyUserFlag();
      const config = await resolveFounderProgramConfig();
      const state = await getFounderProgramState(actor.userId);

      const { skuTier: resolvedSkuTier, isSpecial } = resolveCheckoutSkuTier({
        actor,
        verfyUser,
        body: { ...body, taxSeason },
        founderUser: state.user,
        claimedCount: state.claimedCount,
        programOpen: state.programOpen,
        enabled: config.enabled,
        tiers: config.tiers,
      });

      const paddlePriceId = isSpecial
        ? getPaddlePriceIdSpecial()
        : config.tiers[resolvedSkuTier as PublicFounderTier].paddlePriceId;

      if (isSpecial && !paddlePriceId) {
        throw new Error("PADDLE_SPECIAL_PRICE_MISSING");
      }

      const { intentId, expiresAt } = await createOrReuseCheckoutIntent(
        actor.userId,
        taxSeason,
        resolvedSkuTier,
      );

      return NextResponse.json({
        intentId,
        taxSeason,
        expiresAt: expiresAt.toISOString(),
        skuTier: resolvedSkuTier,
        paddlePriceId,
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
);
