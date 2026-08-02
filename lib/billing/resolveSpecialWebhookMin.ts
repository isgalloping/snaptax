import { founderPriceUsdToCents } from "@/lib/founder/pricing";
import type { PublicFounderTier } from "@/lib/founder/types";
import { prisma } from "@/lib/prisma";
import { resolveFounderProgramConfig } from "@/lib/server/founderConfig";

export type SpecialWebhookMinResolution =
  | { kind: "default" }
  | {
      kind: "tier";
      skuTier: PublicFounderTier | "SPECIAL";
      minAmountCents: number;
    }
  | {
      kind: "error";
      reason:
        | "special_price_unconfigured"
        | "sku_tier_unknown"
        | "tier_price_unconfigured";
    };

export type ResolveSpecialWebhookMinDeps = {
  findIntentSkuTier?: (intentId: string) => Promise<string | null | undefined>;
  getSpecialPriceUsd?: () => Promise<number>;
  getTierPriceCents?: (
    skuTier: PublicFounderTier,
  ) => Promise<number | null | undefined>;
};

function isPublicFounderTier(
  skuTier: string | null | undefined,
): skuTier is PublicFounderTier {
  return (
    skuTier === "FOUNDER_LEVEL_SUPER" ||
    skuTier === "EARLY" ||
    skuTier === "FOUNDER" ||
    skuTier === "DEFAULT"
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
  const effectiveSkuTier = skuTier ?? "DEFAULT";

  if (effectiveSkuTier === "SPECIAL") {
    const getSpecialPriceUsd = deps.getSpecialPriceUsd ?? (async () => 0);
    const specialPriceUsd = await getSpecialPriceUsd();
    if (specialPriceUsd <= 0) {
      return { kind: "error", reason: "special_price_unconfigured" };
    }

    return {
      kind: "tier",
      skuTier: "SPECIAL",
      minAmountCents: founderPriceUsdToCents(specialPriceUsd),
    };
  }

  if (!isPublicFounderTier(effectiveSkuTier)) {
    return { kind: "error", reason: "sku_tier_unknown" };
  }

  const getTierPriceCents =
    deps.getTierPriceCents ??
    (async (tier: PublicFounderTier) => {
      const config = await resolveFounderProgramConfig();
      return config.tiers[tier].priceCents;
    });
  const minAmountCents = await getTierPriceCents(effectiveSkuTier);
  if (minAmountCents == null || minAmountCents <= 0) {
    return { kind: "error", reason: "tier_price_unconfigured" };
  }

  return {
    kind: "tier",
    skuTier: effectiveSkuTier,
    minAmountCents,
  };
}
