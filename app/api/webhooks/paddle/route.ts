import { NextResponse } from "next/server";
import { verifyPaddleWebhookSignature } from "@/lib/server/paddleWebhook";
import {
  validatePaddleTransaction,
  type PaddleWebhookPayload,
} from "@/lib/billing/validatePaddleTransaction";
import {
  markCheckoutIntentConsumed,
  resolveWebhookGrantTarget,
} from "@/lib/billing/checkoutIntent";
import { grantPaddleSeasonEntitlement } from "@/lib/billing/grantSeasonEntitlement";
import type { FounderTier } from "@/lib/founder/types";
import { prisma } from "@/lib/prisma";
import { assignFounderSeatOnFirstPurchase } from "@/lib/server/assignFounderSeat";
import { currentTaxSeason } from "@/lib/tax/season";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { logEvent } from "@/lib/server/log/logEvent";

function isFounderSkuTier(
  tier: string | undefined,
): tier is Exclude<FounderTier, "DEFAULT"> {
  return (
    tier === "FOUNDER_LEVEL_SUPER" ||
    tier === "EARLY" ||
    tier === "FOUNDER"
  );
}

export const POST = withRequestLog("api.webhook", async (request, _context) => {
  const rawBody = await request.text();
  const signature =
    request.headers.get("paddle-signature") ??
    request.headers.get("Paddle-Signature");

  try {
    if (!verifyPaddleWebhookSignature(rawBody, signature)) {
      logEvent({
        ts: new Date().toISOString(),
        level: "warn",
        module: "biz.paddle",
        success: false,
        durationMs: 0,
        meta: { reason: "invalid_signature" },
      });
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "PADDLE_VERIFY_FAILED";
    logEvent({
      ts: new Date().toISOString(),
      level: "error",
      module: "biz.paddle",
      success: false,
      durationMs: 0,
      meta: { errorMessage: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let payload: PaddleWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaddleWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (payload.event_type !== "transaction.completed") {
    return NextResponse.json({ ok: true });
  }

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
    return NextResponse.json({ ok: true, ignored: true });
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
    return NextResponse.json({ ok: true, ignored: true });
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

  const customData = validated.customData;
  const founderPurchase = customData?.founderPurchase === true;
  const skuTier = customData?.skuTier;

  if (founderPurchase && isFounderSkuTier(skuTier)) {
    const seatResult = await assignFounderSeatOnFirstPurchase(grant.userId);

    if (!seatResult.assigned && seatResult.founderNumber != null) {
      await prisma.snaptaxUser.update({
        where: { id: grant.userId },
        data: { founderStatus: "active" },
      });
    }

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
        tier: seatResult.tier ?? skuTier,
        founderPurchase: true,
        transactionId: validated.transactionId,
        taxSeason,
      },
    });
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

  return NextResponse.json({ ok: true });
});
