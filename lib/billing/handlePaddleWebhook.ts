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
import type { FounderTier } from "@/lib/founder/types";
import { prisma } from "@/lib/prisma";
import { assignFounderSeatOnFirstPurchase } from "@/lib/server/assignFounderSeat";
import { currentTaxSeason } from "@/lib/tax/season";
import { logEvent } from "@/lib/server/log/logEvent";

export type PaddleNotificationPayload = PaddleWebhookPayload & {
  event_id?: string;
  occurred_at?: string;
};

function isFounderSkuTier(
  tier: string | undefined,
): tier is Exclude<FounderTier, "DEFAULT"> {
  return (
    tier === "FOUNDER_LEVEL_SUPER" ||
    tier === "EARLY" ||
    tier === "FOUNDER"
  );
}

async function handleTransactionCompleted(
  payload: PaddleWebhookPayload,
  auditId: string,
): Promise<{ ok: true; ignored?: boolean }> {
  const validated = validatePaddleTransaction(payload);
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
  const founderSkuTier = isFounderSkuTier(skuTierFromIntent)
    ? skuTierFromIntent
    : isFounderSkuTier(skuTierFromCustomData)
      ? skuTierFromCustomData
      : undefined;

  if (founderSkuTier) {
    const seatResult = await assignFounderSeatOnFirstPurchase(grant.userId);

    if (!seatResult.assigned && seatResult.founderNumber != null) {
      await prisma.snaptaxUser.update({
        where: { id: grant.userId },
        data: { founderStatus: "active" },
      });
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
): Promise<{ ok: true; ignored?: boolean }> {
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
): Promise<{ ok: true; duplicate?: boolean; ignored?: boolean }> {
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
    return handleTransactionCompleted(payload, begun.id);
  }

  if (
    eventType === "adjustment.created" ||
    eventType === "adjustment.updated"
  ) {
    return handleAdjustment(payload, begun.id);
  }

  await finishWebhookEvent(begun.id, {
    processingResult: "ignored",
    processingReason: "unhandled_event_type",
  });
  return { ok: true, ignored: true };
}
