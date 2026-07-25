import { founderPriceUsdToCents } from "@/lib/founder/pricing";
import { prisma } from "@/lib/prisma";

export type SpecialWebhookMinResolution =
  | { kind: "default" }
  | { kind: "special"; minAmountCents: number }
  | { kind: "error"; reason: "special_price_unconfigured" };

export type ResolveSpecialWebhookMinDeps = {
  findIntentSkuTier?: (intentId: string) => Promise<string | null | undefined>;
  getSpecialPriceUsd?: () => Promise<number>;
};

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
  if (skuTier !== "SPECIAL") return { kind: "default" };

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
