import type { PaddleWebhookPayload } from "@/lib/billing/validatePaddleTransaction";
import type { PublicFounderTier } from "@/lib/founder/types";
import { prisma } from "@/lib/prisma";
import { resolveFounderProgramConfig } from "@/lib/server/founderConfig";
import { getSpecialLevelUserPriceId } from "@/lib/server/env";

export type PaddlePriceIdValidation =
  | { ok: true }
  | { ok: false; reason: "unexpected_price_id" };

type PaddleWebhookItem = {
  price_id?: string;
  price?: { id?: string };
};

function isPublicFounderTier(tier: string): tier is PublicFounderTier {
  return (
    tier === "FOUNDER_LEVEL_SUPER" ||
    tier === "EARLY" ||
    tier === "FOUNDER" ||
    tier === "DEFAULT"
  );
}

/** Extract Paddle price id(s) from a transaction.completed payload. */
export function extractPaddleTransactionPriceIds(
  payload: PaddleWebhookPayload,
): string[] {
  const items = payload.data?.items as PaddleWebhookItem[] | undefined;
  if (!Array.isArray(items)) return [];

  const ids: string[] = [];
  for (const item of items) {
    const id = item.price?.id?.trim() || item.price_id?.trim();
    if (id) ids.push(id);
  }
  return ids;
}

export async function collectConfiguredPaddlePriceIds(): Promise<Set<string>> {
  const config = await resolveFounderProgramConfig();
  const ids = new Set<string>();
  for (const tier of Object.values(config.tiers)) {
    if (tier.paddlePriceId) ids.add(tier.paddlePriceId);
  }
  const special = getSpecialLevelUserPriceId();
  if (special) ids.add(special);
  return ids;
}

async function expectedPriceIdForIntent(
  intentId: string,
): Promise<string | null> {
  const intent = await prisma.snaptaxCheckoutIntent.findUnique({
    where: { id: intentId },
    select: { skuTier: true },
  });
  if (!intent) return null;

  const skuTier = intent.skuTier?.trim();
  if (skuTier === "SPECIAL") {
    return getSpecialLevelUserPriceId() || null;
  }

  const tier = skuTier && isPublicFounderTier(skuTier) ? skuTier : "DEFAULT";
  const config = await resolveFounderProgramConfig();
  return config.tiers[tier].paddlePriceId || null;
}

function matchesConfiguredPrice(
  transactionPriceIds: string[],
  allowed: Set<string>,
): boolean {
  return transactionPriceIds.some((id) => allowed.has(id));
}

export async function validatePaddleTransactionPriceIds(params: {
  transactionPriceIds: string[];
  intentId?: string;
  collectConfigured?: () => Promise<Set<string>>;
  resolveExpectedForIntent?: (intentId: string) => Promise<string | null>;
}): Promise<PaddlePriceIdValidation> {
  const transactionPriceIds = params.transactionPriceIds.filter(Boolean);
  if (transactionPriceIds.length === 0) {
    // Payload has no line items — amount/currency validation already passed.
    return { ok: true };
  }

  const resolveExpectedForIntent =
    params.resolveExpectedForIntent ?? expectedPriceIdForIntent;
  const collectConfigured =
    params.collectConfigured ?? collectConfiguredPaddlePriceIds;

  const intentId = params.intentId?.trim();
  if (intentId) {
    const expected = await resolveExpectedForIntent(intentId);
    if (expected && transactionPriceIds.includes(expected)) {
      return { ok: true };
    }
    const allowed = await collectConfigured();
    if (matchesConfiguredPrice(transactionPriceIds, allowed)) {
      return { ok: true };
    }
    return { ok: false, reason: "unexpected_price_id" };
  }

  const allowed = await collectConfigured();
  if (matchesConfiguredPrice(transactionPriceIds, allowed)) {
    return { ok: true };
  }
  return { ok: false, reason: "unexpected_price_id" };
}
