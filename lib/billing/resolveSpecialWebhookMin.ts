import { founderPriceUsdToCents } from "@/lib/founder/pricing";
import type { PublicFounderTier } from "@/lib/founder/types";
import { prisma } from "@/lib/prisma";
import { resolveFounderProgramConfig } from "@/lib/server/founderConfig";

export type SpecialWebhookMinResolution =
  | { kind: "default" }
  | { kind: "tier"; minAmountCents: number }
  | { kind: "special"; minAmountCents: number }
  | {
      kind: "error";
      reason: "special_price_unconfigured" | "unknown_sku_tier";
    };

export type ResolveSpecialWebhookMinDeps = {
  findIntentSkuTier?: (intentId: string) => Promise<string | null | undefined>;
  getSpecialPriceUsd?: () => Promise<number>;
  getTierPriceCents?: (skuTier: PublicFounderTier) => Promise<number | null>;
};

export function minAmountCentsFromResolution(
  resolution: SpecialWebhookMinResolution,
): number | undefined {
  return resolution.kind === "special" || resolution.kind === "tier"
    ? resolution.minAmountCents
    : undefined;
}

function isPublicFounderTier(tier: string | null | undefined): tier is PublicFounderTier {
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

  const skuTier = (await findIntentSkuTier(trimmed)) ?? "DEFAULT";
  if (isPublicFounderTier(skuTier)) {
    const getTierPriceCents =
      deps.getTierPriceCents ??
      (async (tier) => {
        const config = await resolveFounderProgramConfig();
        return config.tiers[tier].priceCents;
      });
    const minAmountCents = await getTierPriceCents(skuTier);
    return minAmountCents != null
      ? { kind: "tier", minAmountCents }
      : { kind: "default" };
  }

  if (skuTier !== "SPECIAL") {
    return { kind: "error", reason: "unknown_sku_tier" };
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
