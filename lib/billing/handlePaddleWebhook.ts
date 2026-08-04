import { specialPriceFlag as defaultSpecialPriceFlag } from "@/flags/special";
import { resolveSpecialWebhookMinAmountCents as defaultResolveSpecialWebhookMinAmountCents } from "@/lib/billing/resolveSpecialWebhookMin";
import {
  validatePaddleTransaction as defaultValidatePaddleTransaction,
  type PaddleWebhookPayload,
} from "@/lib/billing/validatePaddleTransaction";
import {
  markCheckoutIntentConsumed as defaultMarkCheckoutIntentConsumed,
  resolveWebhookGrantTarget as defaultResolveWebhookGrantTarget,
} from "@/lib/billing/checkoutIntent";
import { grantPaddleSeasonEntitlement as defaultGrantPaddleSeasonEntitlement } from "@/lib/billing/grantSeasonEntitlement";
import { parsePaddleAdjustmentPayload as defaultParsePaddleAdjustmentPayload } from "@/lib/billing/parsePaddleAdjustment";
import { applySeasonEntitlementAdjustment as defaultApplySeasonEntitlementAdjustment } from "@/lib/billing/applySeasonEntitlementAdjustment";
import {
  WEBHOOK_CHANNEL_PADDLE,
  beginWebhookEvent as defaultBeginWebhookEvent,
  finishWebhookEvent as defaultFinishWebhookEvent,
} from "@/lib/billing/recordWebhookEvent";
import { isFounderSkuTier } from "@/lib/billing/founderSkuTier";
import { prisma } from "@/lib/prisma";
import { assignFounderSeatOnFirstPurchase as defaultAssignFounderSeatOnFirstPurchase } from "@/lib/server/assignFounderSeat";
import { currentTaxSeason as defaultCurrentTaxSeason } from "@/lib/tax/season";
import { logEvent as defaultLogEvent } from "@/lib/server/log/logEvent";

export type PaddleNotificationPayload = PaddleWebhookPayload & {
  event_id?: string;
  occurred_at?: string;
};

export type HandlePaddleWebhookDeps = {
  specialPriceFlag?: typeof defaultSpecialPriceFlag;
  resolveSpecialWebhookMinAmountCents?: typeof defaultResolveSpecialWebhookMinAmountCents;
  validatePaddleTransaction?: typeof defaultValidatePaddleTransaction;
  resolveWebhookGrantTarget?: typeof defaultResolveWebhookGrantTarget;
  grantPaddleSeasonEntitlement?: typeof defaultGrantPaddleSeasonEntitlement;
  markCheckoutIntentConsumed?: typeof defaultMarkCheckoutIntentConsumed;
  parsePaddleAdjustmentPayload?: typeof defaultParsePaddleAdjustmentPayload;
  applySeasonEntitlementAdjustment?: typeof defaultApplySeasonEntitlementAdjustment;
  beginWebhookEvent?: typeof defaultBeginWebhookEvent;
  finishWebhookEvent?: typeof defaultFinishWebhookEvent;
  assignFounderSeatOnFirstPurchase?: typeof defaultAssignFounderSeatOnFirstPurchase;
  updateFounderStatusActive?: (userId: string) => Promise<void>;
  currentTaxSeason?: typeof defaultCurrentTaxSeason;
  logEvent?: typeof defaultLogEvent;
};

async function handleTransactionCompleted(
  payload: PaddleWebhookPayload,
  auditId: string,
  deps: HandlePaddleWebhookDeps,
): Promise<{ ok: true; ignored?: boolean }> {
  const finishWebhookEvent =
    deps.finishWebhookEvent ?? defaultFinishWebhookEvent;
  const logEvent = deps.logEvent ?? defaultLogEvent;
  const resolveSpecialWebhookMinAmountCents =
    deps.resolveSpecialWebhookMinAmountCents ??
    defaultResolveSpecialWebhookMinAmountCents;
  const validatePaddleTransaction =
    deps.validatePaddleTransaction ?? defaultValidatePaddleTransaction;
  const resolveWebhookGrantTarget =
    deps.resolveWebhookGrantTarget ?? defaultResolveWebhookGrantTarget;
  const grantPaddleSeasonEntitlement =
    deps.grantPaddleSeasonEntitlement ?? defaultGrantPaddleSeasonEntitlement;
  const markCheckoutIntentConsumed =
    deps.markCheckoutIntentConsumed ?? defaultMarkCheckoutIntentConsumed;
  const currentTaxSeason = deps.currentTaxSeason ?? defaultCurrentTaxSeason;
  const assignFounderSeatOnFirstPurchase =
    deps.assignFounderSeatOnFirstPurchase ??
    defaultAssignFounderSeatOnFirstPurchase;
  const updateFounderStatusActive =
    deps.updateFounderStatusActive ??
    (async (userId: string) => {
      await prisma.snaptaxUser.update({
        where: { id: userId },
        data: { founderStatus: "active" },
      });
    });

  const intentId = payload.data?.custom_data?.intentId;
  const minResolution = await resolveSpecialWebhookMinAmountCents(intentId, {
    getSpecialPriceUsd: deps.specialPriceFlag ?? defaultSpecialPriceFlag,
  });
  if (minResolution.kind === "error") {
    await finishWebhookEvent(auditId, {
      processingResult: "ignored",
      processingReason: minResolution.reason,
    });
    return { ok: true, ignored: true };
  }
  const minAmountCents =
    minResolution.kind === "special"
      ? minResolution.minAmountCents
      : undefined;

  const validated = validatePaddleTransaction(payload, { minAmountCents });
  if (!validated.ok) {
    logEvent({
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
    await finishWebhookEvent(auditId, {
      processingResult: "ignored",
      processingReason: validated.reason,
    });
    return { ok: true, ignored: true };
  }

  const grant = await resolveWebhookGrantTarget(validated.customData);
  if (
    grant.ok &&
    validated.customData?.skuTier === "SPECIAL" &&
    grant.skuTier !== "SPECIAL"
  ) {
    await finishWebhookEvent(auditId, {
      processingResult: "ignored",
      processingReason: "sku_tier_mismatch",
      transactionId: validated.transactionId,
    });
    return { ok: true, ignored: true };
  }

  if (!grant.ok) {
    logEvent({
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
    await finishWebhookEvent(auditId, {
      processingResult: "ignored",
      processingReason: grant.reason,
      transactionId: validated.transactionId,
    });
    return { ok: true, ignored: true };
  }

  if (grant.legacyUserIdPath) {
    logEvent({
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
    logEvent({
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

  const entitlement = await grantPaddleSeasonEntitlement({
    userId: grant.userId,
    taxSeason,
    transactionId: validated.transactionId,
    amountUsd: validated.amountUsd,
  });

  if (entitlement.duplicateSeason) {
    logEvent({
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
    await markCheckoutIntentConsumed(grant.intentId, validated.transactionId);
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
    const seatResult = await assignFounderSeatOnFirstPurchase(grant.userId);

    if (!seatResult.assigned && seatResult.founderNumber != null) {
      await updateFounderStatusActive(grant.userId);
    }

    if (seatResult.seatUnavailable) {
      logEvent({
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
      logEvent({
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

  logEvent({
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

  await finishWebhookEvent(auditId, {
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
  const finishWebhookEvent =
    deps.finishWebhookEvent ?? defaultFinishWebhookEvent;
  const parsePaddleAdjustmentPayload =
    deps.parsePaddleAdjustmentPayload ?? defaultParsePaddleAdjustmentPayload;
  const applySeasonEntitlementAdjustment =
    deps.applySeasonEntitlementAdjustment ??
    defaultApplySeasonEntitlementAdjustment;

  const parsed = parsePaddleAdjustmentPayload(payload);
  if (!parsed) {
    await finishWebhookEvent(auditId, {
      processingResult: "ignored",
      processingReason: "adjustment_parse_failed",
    });
    return { ok: true, ignored: true };
  }

  const result = await applySeasonEntitlementAdjustment({
    transactionId: parsed.transactionId,
    action: parsed.action,
    adjustmentStatus: parsed.adjustmentStatus,
  });

  await finishWebhookEvent(auditId, {
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
  const beginWebhookEvent = deps.beginWebhookEvent ?? defaultBeginWebhookEvent;
  const finishWebhookEvent =
    deps.finishWebhookEvent ?? defaultFinishWebhookEvent;
  const eventType = payload.event_type ?? "unknown";
  const eventId =
    (typeof payload.event_id === "string" && payload.event_id) ||
    `synthetic:${eventType}:${payload.data?.id ?? "none"}:${payload.occurred_at ?? "na"}`;

  const occurredAt = payload.occurred_at
    ? new Date(payload.occurred_at)
    : null;

  const begun = await beginWebhookEvent({
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

  await finishWebhookEvent(begun.id, {
    processingResult: "ignored",
    processingReason: "unhandled_event_type",
  });
  return { ok: true, ignored: true };
}
