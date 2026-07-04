import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { createOrReuseCheckoutIntent } from "@/lib/billing/checkoutIntent";
import type { FounderTier } from "@/lib/founder/types";
import { resolveFounderProgramConfig } from "@/lib/server/founderConfig";
import {
  getFounderProgramState,
  resolveFounderCheckoutSkuTier,
} from "@/lib/server/founderProgram";
import { resolveSeasonOfferFromState } from "@/lib/server/seasonOffer";
import { currentTaxSeason } from "@/lib/tax/season";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

const founderTierSchema = z.enum([
  "FOUNDER_LEVEL_SUPER",
  "EARLY",
  "FOUNDER",
  "DEFAULT",
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

      let resolvedSkuTier: FounderTier;

      if (body.founderPurchase) {
        const state = await getFounderProgramState(actor.userId);
        const resolution = resolveFounderCheckoutSkuTier({
          user: state.user,
          claimedCount: state.claimedCount,
          programOpen: state.programOpen,
        });
        if (!resolution.ok) {
          throw new Error(resolution.error);
        }
        resolvedSkuTier = resolution.skuTier;
      } else if (body.skuTier != null) {
        resolvedSkuTier = body.skuTier;
      } else {
        const config = await resolveFounderProgramConfig();
        const state = await getFounderProgramState(actor.userId);
        const offer = resolveSeasonOfferFromState({
          enabled: config.enabled,
          tiers: config.tiers,
          user: state.user,
          claimedCount: state.claimedCount,
          programOpen: state.programOpen,
          taxSeason,
        });
        resolvedSkuTier = offer.skuTier;
      }

      const config = await resolveFounderProgramConfig();
      const tierConfig = config.tiers[resolvedSkuTier];

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
        paddlePriceId: tierConfig.paddlePriceId,
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
);
