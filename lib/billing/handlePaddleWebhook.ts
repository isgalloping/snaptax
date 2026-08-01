import { specialPriceFlag } from "@/flags/special";
import { resolveSpecialWebhookMinAmountCents } from "@/lib/billing/resolveSpecialWebhookMin";
import {
  validatePaddleTransaction,
  type PaddleWebhookPayload,
} from "@/lib/billing/validatePaddleTransaction";
import {
  markCheckoutIntentConsumed,
  resolveWebhookGrantTarget,
} from "@/lib/billing/checkoutIntent";
import { grantPaddleSeasonEntitlement } from "@/lib/billing/grantSeasonEntitlement";
import { parsePaddleAdjustmentPayload } from "@/lib/billing/parsePaddleAdjustment";
import { applySeasonEntitlementAdjustment } from "@/lib/billing/applySeasonEntitlementAdjustment";
import {
  WEBHOOK_CHANNEL_PADDLE,
  beginWebhookEvent,
  finishWebhookEvent,
} from "@/lib/billing/recordWebhookEvent";
import { isFounderSkuTier } from "@/lib/billing/founderSkuTier";
import { prisma } from "@/lib/prisma";
import { assignFounderSeatOnFirstPurchase } from "@/lib/server/assignFounderSeat";
import { currentTaxSeason } from "@/lib/tax/season";
import { logEvent } from "@/lib/server/log/logEvent";

export type PaddleNotificationPayload = PaddleWebhookPayload & {
  event_id?: string;
  occurred_at?: string;
};

export type HandlePaddleWebhookDeps = {
  beginWebhookEvent?: typeof beginWebhookEvent;
  finishWebhookEvent?: typeof finishWebhookEvent;
  resolveSpecialWebhookMinAmountCents?: typeof resolveSpecialWebhookMinAmountCents;
  getSpecialPriceUsd?: () => Promise<number>;
  validatePaddleTransaction?: typeof validatePaddleTransaction;
  resolveWebhookGrantTarget?: typeof resolveWebhookGrantTarget;
  grantPaddleSeasonEntitlement?: typeof grantPaddleSeasonEntitlement;
  markCheckoutIntentConsumed?: typeof markCheckoutIntentConsumed;
  parsePaddleAdjustmentPayload?: typeof parsePaddleAdjustmentPayload;
  applySeasonEntitlementAdjustment?: typeof applySeasonEntitlementAdjustment;
  assignFounderSeatOnFirstPurchase?: typeof assignFounderSeatOnFirstPurchase;
  updateFounderStatusActive?: (userId: string) => Promise<void>;
  logEvent?: typeof logEvent;
};

async function updateFounderStatusActive(userId: string): Promise<void> {
  await prisma.snaptaxUser.update({
    where: { id: userId },
    data: { founderStatus: "active" },
  });
}

async function handleTransactionCompleted(
  payload: PaddleWebhookPayload,
  auditId: string,
  deps: HandlePaddleWebhookDeps,
): Promise<{ ok: true; ignored?: boolean }> {
  const finish = deps.finishWebhookEvent ?? finishWebhookEvent;
  const writeLog = deps.logEvent ?? logEvent;
  const intentId = payload.data?.custom_data?.intentId;
  const resolveSpecialMin =
    deps.resolveSpecialWebhookMinAmountCents ??
    resolveSpecialWebhookMinAmountCents;
  const minResolution = await resolveSpecialMin(intentId, {
    getSpecialPriceUsd: deps.getSpecialPriceUsd ?? specialPriceFlag,
  });
  if (minResolution.kind === "error") {
    await finish(auditId, {
      processingResult: "ignored",
      processingReason: minResolution.reason,
    });
    return { ok: true, ignored: true };
  }
  const minAmountCents =
    minResolution.kind === "special"
      ? minResolution.minAmountCents
      : undefined;

  const validateTransaction =
    deps.validatePaddleTransaction ?? validatePaddleTransaction;
  const validated = validateTransaction(payload, { minAmountCents });
  if (!validated.ok) {
    writeLog({
      ts: new Date().toISOString(),
      level: "warn",
      module: "biz.paddle",
      success: false,
      durationMs: 0,
      meta: {
        reason: validated.reason,
        eventType: payload.event_type,
      },
    });
    await finish(auditId, {
      processingResult: "ignored",
      processingReason: validated.reason,
    });
    return { ok: true, ignored: true };
  }

  const resolveGrantTarget =
    deps.resolveWebhookGrantTarget ?? resolveWebhookGrantTarget;
  const grant = await resolveGrantTarget(validated.customData);
  if (
    grant.ok &&
    validated.customData?.skuTier === "SPECIAL" &&
    grant.skuTier !== "SPECIAL"
  ) {
    await finish(auditId, {
      processingResult: "ignored",
      processingReason: "sku_tier_mismatch",
      transactionId: validated.transactionId,
    });
    return { ok: true, ignored: true };
  }

  if (!grant.ok) {
    writeLog({
      ts: new Date().toISOString(),
      level: "warn",
      module: "biz.paddle",
      success: false,
      durationMs: 0,
      meta: {
        reason: grant.reason,
        transactionId: validated.transactionId,
      },
    });
    await finish(auditId, {
      processingResult: "ignored",
      processingReason: grant.reason,
      transactionId: validated.transactionId,
    });
    return { ok: true, ignored: true };
  }

  if (grant.legacyUserIdPath) {
    writeLog({
      ts: new Date().toISOString(),
      level: "warn",
      module: "biz.paddle",
      success: true,
      durationMs: 0,
      meta: {
        reason: "deprecated_custom_data_user_id",
        transactionId: validated.transactionId,
      },
    });
  }

  if (grant.intentExpiredAtGrant) {
    writeLog({
      ts: new Date().toISOString(),
      level: "warn",
      module: "biz.paddle",
      success: true,
      durationMs: 0,
      meta: {
        reason: "intent_expired_but_granted",
        transactionId: validated.transactionId,
        intentId: grant.intentId ?? null,
      },
    });
  }

  const taxSeason =
    grant.taxSeason && grant.taxSeason.length > 0
      ? grant.taxSeason
      : currentTaxSeason();

  const grantEntitlement =
    deps.grantPaddleSeasonEntitlement ?? grantPaddleSeasonEntitlement;
  const entitlement = await grantEntitlement({
    userId: grant.userId,
    taxSeason,
    transactionId: validated.transactionId,
    amountUsd: validated.amountUsd,
  });

  if (entitlement.duplicateSeason) {
    writeLog({
      ts: new Date().toISOString(),
      level: "warn",
      module: "biz.paddle",
      success: true,
      durationMs: 0,
      meta: {
        reason: "duplicate_season_purchase",
        transactionId: validated.transactionId,
        existingTransactionId: entitlement.transactionId,
        taxSeason,
      },
    });
  }

  if (grant.intentId) {
    const markIntentConsumed =
      deps.markCheckoutIntentConsumed ?? markCheckoutIntentConsumed;
    await markIntentConsumed(grant.intentId, validated.transactionId);
  }

  const skuTierFromIntent = grant.skuTier ?? undefined;
  const skuTierFromCustomData = validated.customData?.skuTier;
  const effectiveSkuTier = skuTierFromIntent ?? skuTierFromCustomData;
  const founderSkuTier = isFounderSkuTier(skuTierFromIntent)
    ? skuTierFromIntent
    : isFounderSkuTier(skuTierFromCustomData)
      ? skuTierFromCustomData
      : undefined;

  if (founderSkuTier) {
    const assignFounderSeat =
      deps.assignFounderSeatOnFirstPurchase ?? assignFounderSeatOnFirstPurchase;
    const seatResult = await assignFounderSeat(grant.userId);

    if (!seatResult.assigned && seatResult.founderNumber != null) {
      const updateFounderStatus =
        deps.updateFounderStatusActive ?? updateFounderStatusActive;
      await updateFounderStatus(grant.userId);
    }

    if (seatResult.seatUnavailable) {
      writeLog({
        ts: new Date().toISOString(),
        level: "warn",
        module: "biz.founder",
        success: false,
        durationMs: 0,
        userId: grant.userId,
        meta: {
          event: "founder_seat_unavailable_after_payment",
          transactionId: validated.transactionId,
          tier: founderSkuTier,
          taxSeason,
        },
      });
    } else {
      writeLog({
        ts: new Date().toISOString(),
        level: "info",
        module: "biz.founder",
        success: true,
        durationMs: 0,
        userId: grant.userId,
        meta: {
          event: "founder_purchase_success",
          founderNumber: seatResult.founderNumber,
          tier: seatResult.tier ?? founderSkuTier,
          reason: seatResult.assigned
            ? "new_seat_assigned"
            : "existing_founder_seat",
          transactionId: validated.transactionId,
          taxSeason,
        },
      });
    }
  }

  writeLog({
    ts: new Date().toISOString(),
    level: "info",
    module: "biz.paddle",
    success: true,
    durationMs: 0,
    meta: {
      transactionId: validated.transactionId,
      taxSeason,
      intentId: grant.intentId ?? null,
      entitlementCreated: entitlement.created,
      ...(effectiveSkuTier === "SPECIAL"
        ? { skuTier: "SPECIAL", internalTestCheckout: true }
        : {}),
    },
  });

  await finish(auditId, {
    processingResult: "applied",
    processingReason: entitlement.created
      ? "entitlement_created"
      : "entitlement_updated",
    transactionId: validated.transactionId,
    statusAfter: "active",
  });

  return { ok: true };
}

async function handleAdjustment(
  payload: unknown,
  auditId: string,
  deps: HandlePaddleWebhookDeps,
): Promise<{ ok: true; ignored?: boolean }> {
  const finish = deps.finishWebhookEvent ?? finishWebhookEvent;
  const parseAdjustment =
    deps.parsePaddleAdjustmentPayload ?? parsePaddleAdjustmentPayload;
  const parsed = parseAdjustment(payload);
  if (!parsed) {
    await finish(auditId, {
      processingResult: "ignored",
      processingReason: "adjustment_parse_failed",
    });
    return { ok: true, ignored: true };
  }

  const applyAdjustment =
    deps.applySeasonEntitlementAdjustment ?? applySeasonEntitlementAdjustment;
  const result = await applyAdjustment({
    transactionId: parsed.transactionId,
    action: parsed.action,
    adjustmentStatus: parsed.adjustmentStatus,
  });

  await finish(auditId, {
    processingResult: result.applied ? "applied" : "ignored",
    processingReason: result.reason,
    transactionId: parsed.transactionId,
    adjustmentId: parsed.adjustmentId,
    action: parsed.action,
    adjustmentStatus: parsed.adjustmentStatus,
    entitlementId: result.entitlementId ?? null,
    statusBefore: result.statusBefore ?? null,
    statusAfter: result.statusAfter ?? null,
  });

  return { ok: true, ignored: !result.applied };
}

/** Business handler after signature verify + JSON parse. Always prefers ok for audit durability. */
export async function handlePaddleWebhookPayload(
  payload: PaddleNotificationPayload,
  deps: HandlePaddleWebhookDeps = {},
): Promise<{ ok: true; duplicate?: boolean; ignored?: boolean }> {
  const eventType = payload.event_type ?? "unknown";
  const eventId =
    (typeof payload.event_id === "string" && payload.event_id) ||
    `synthetic:${eventType}:${payload.data?.id ?? "none"}:${payload.occurred_at ?? "na"}`;

  const occurredAt = payload.occurred_at
    ? new Date(payload.occurred_at)
    : null;

  const begin = deps.beginWebhookEvent ?? beginWebhookEvent;
  const finish = deps.finishWebhookEvent ?? finishWebhookEvent;
  const begun = await begin({
    channelCode: WEBHOOK_CHANNEL_PADDLE,
    eventId,
    eventType,
    payload: payload as object,
    occurredAt:
      occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : null,
    processingResult: "received",
  });

  if (!begun.shouldProcess) {
    return { ok: true, duplicate: begun.duplicate };
  }

  if (eventType === "transaction.completed") {
    return handleTransactionCompleted(payload, begun.id, deps);
  }

  if (
    eventType === "adjustment.created" ||
    eventType === "adjustment.updated"
  ) {
    return handleAdjustment(payload, begun.id, deps);
  }

  await finish(begun.id, {
    processingResult: "ignored",
    processingReason: "unhandled_event_type",
  });
  return { ok: true, ignored: true };
}
