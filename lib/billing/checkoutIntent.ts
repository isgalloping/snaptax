import { prisma } from "@/lib/prisma";
import { utcNow } from "@/lib/time/utc";

export const CHECKOUT_INTENT_TTL_MS = 15 * 60 * 1000;

export type CheckoutIntentResult = {
  intentId: string;
  expiresAt: Date;
};

export async function createOrReuseCheckoutIntent(
  userId: string,
  taxSeason: string,
): Promise<CheckoutIntentResult> {
  const now = utcNow();

  const existing = await prisma.snaptaxCheckoutIntent.findFirst({
    where: {
      userId,
      taxSeason,
      status: "pending",
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return { intentId: existing.id, expiresAt: existing.expiresAt };
  }

  const expiresAt = new Date(now.getTime() + CHECKOUT_INTENT_TTL_MS);
  const created = await prisma.snaptaxCheckoutIntent.create({
    data: {
      userId,
      taxSeason,
      status: "pending",
      expiresAt,
    },
  });

  return { intentId: created.id, expiresAt: created.expiresAt };
}

export type CheckoutIntentRecord = {
  id: string;
  userId: string;
  taxSeason: string;
  status: string;
  expiresAt: Date;
};

export type IntentGrantEvaluation =
  | { ok: true; intentExpiredAtGrant: boolean }
  | { ok: false; reason: string };

export function evaluateIntentGrant(
  intent: CheckoutIntentRecord,
  now: Date,
): IntentGrantEvaluation {
  if (intent.status === "consumed") {
    return { ok: false, reason: "intent_not_pending" };
  }

  const expired = intent.expiresAt.getTime() <= now.getTime();
  if (expired) {
    if (intent.status === "pending" || intent.status === "expired") {
      return { ok: true, intentExpiredAtGrant: true };
    }
    return { ok: false, reason: "intent_expired" };
  }

  if (intent.status !== "pending") {
    return { ok: false, reason: "intent_not_pending" };
  }

  return { ok: true, intentExpiredAtGrant: false };
}

export type WebhookGrantResolution =
  | {
      ok: true;
      userId: string;
      taxSeason: string;
      intentId?: string;
      legacyUserIdPath?: boolean;
      intentExpiredAtGrant?: boolean;
    }
  | { ok: false; reason: string };

export async function resolveWebhookGrantTarget(customData: {
  intentId?: string;
  userId?: string;
  taxSeason?: string;
} | undefined): Promise<WebhookGrantResolution> {
  const intentId = customData?.intentId?.trim();
  if (intentId) {
    const intent = await prisma.snaptaxCheckoutIntent.findUnique({
      where: { id: intentId },
    });

    if (!intent) {
      return { ok: false, reason: "intent_not_found" };
    }

    const now = utcNow();
    const evaluation = evaluateIntentGrant(intent, now);
    if (!evaluation.ok) {
      return { ok: false, reason: evaluation.reason };
    }

    if (evaluation.intentExpiredAtGrant && intent.status === "pending") {
      await prisma.snaptaxCheckoutIntent.update({
        where: { id: intent.id },
        data: { status: "expired" },
      });
    }

    return {
      ok: true,
      userId: intent.userId,
      taxSeason: intent.taxSeason,
      intentId: intent.id,
      intentExpiredAtGrant: evaluation.intentExpiredAtGrant,
    };
  }

  const legacyUserId = customData?.userId?.trim();
  if (legacyUserId) {
    return {
      ok: true,
      userId: legacyUserId,
      taxSeason: customData?.taxSeason?.trim() ?? "",
      legacyUserIdPath: true,
    };
  }

  return { ok: false, reason: "missing_grant_target" };
}

export async function markCheckoutIntentConsumed(
  intentId: string,
  transactionId: string,
): Promise<void> {
  await prisma.snaptaxCheckoutIntent.update({
    where: { id: intentId },
    data: {
      status: "consumed",
      transactionId,
    },
  });
}

export function isCheckoutIntentExpired(
  expiresAt: Date,
  now: Date = utcNow(),
): boolean {
  return expiresAt.getTime() <= now.getTime();
}
