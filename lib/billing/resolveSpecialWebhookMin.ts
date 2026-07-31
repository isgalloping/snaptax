import { founderPriceUsdToCents } from "@/lib/founder/pricing";
import type { PublicFounderTier } from "@/lib/founder/types";
import { prisma } from "@/lib/prisma";
import { resolveFounderProgramConfig } from "@/lib/server/founderConfig";

export type SpecialWebhookMinResolution =
  | { kind: "default" }
  | { kind: "tier"; skuTier: PublicFounderTier; minAmountCents: number }
  | { kind: "special"; minAmountCents: number }
  | {
      kind: "error";
      reason:
        | "special_price_unconfigured"
        | "tier_price_unconfigured"
        | "unknown_sku_tier";
    };

export type ResolveSpecialWebhookMinDeps = {
  findIntentSkuTier?: (intentId: string) => Promise<string | null | undefined>;
  getFounderTierPriceCents?: (tier: PublicFounderTier) => Promise<number>;
  getSpecialPriceUsd?: () => Promise<number>;
};

function isPublicFounderTier(tier: string): tier is PublicFounderTier {
  return (
    tier === "FOUNDER_LEVEL_SUPER" ||
    tier === "EARLY" ||
    tier === "FOUNDER" ||
    tier === "DEFAULT"
  );
}

export async function resolveSpecialWebhookMinAmountCents(
  intentId: string | undefined,
  deps: ResolveSpecialWebhookMinDeps = {},
): Promise<SpecialWebhookMinResolution> {
  const trimmed = intentId?.trim();
  if (!trimmed) return { kind: "default" };

  const findIntentSkuTier =
    deps.findIntentSkuTier ??
    (async (id) => {
      const intent = await prisma.snaptaxCheckoutIntent.findUnique({
        where: { id },
        select: { skuTier: true },
      });
      return intent?.skuTier;
    });

  const skuTier = await findIntentSkuTier(trimmed);
  if (skuTier !== "SPECIAL") {
    const publicTier = skuTier ?? "DEFAULT";
    if (!isPublicFounderTier(publicTier)) {
      return { kind: "error", reason: "unknown_sku_tier" };
    }

    const getFounderTierPriceCents =
      deps.getFounderTierPriceCents ??
      (async (tier: PublicFounderTier) => {
        const config = await resolveFounderProgramConfig();
        return config.tiers[tier].priceCents;
      });
    const minAmountCents = await getFounderTierPriceCents(publicTier);
    if (!Number.isFinite(minAmountCents) || minAmountCents <= 0) {
      return { kind: "error", reason: "tier_price_unconfigured" };
    }
    return { kind: "tier", skuTier: publicTier, minAmountCents };
  }

  const getSpecialPriceUsd = deps.getSpecialPriceUsd ?? (async () => 0);
  const specialPriceUsd = await getSpecialPriceUsd();
  if (specialPriceUsd <= 0) {
    return { kind: "error", reason: "special_price_unconfigured" };
  }

  return {
    kind: "special",
    minAmountCents: founderPriceUsdToCents(specialPriceUsd),
  };
}
