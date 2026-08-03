import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  handlePaddleWebhookPayload,
  type PaddleWebhookDeps,
  type PaddleNotificationPayload,
} from "./handlePaddleWebhook";

function completedPayload(customData: {
  intentId?: string;
  skuTier?: string;
}): PaddleNotificationPayload {
  return {
    event_id: `evt-${customData.intentId ?? "none"}-${customData.skuTier ?? "none"}`,
    event_type: "transaction.completed",
    occurred_at: "2026-07-25T12:00:00.000Z",
    data: {
      id: `txn-${customData.intentId ?? "none"}`,
      status: "completed",
      custom_data: customData,
      details: {
        totals: {
          total: "100",
          currency_code: "USD",
        },
      },
    },
  };
}

function testDeps(
  overrides: Partial<PaddleWebhookDeps> = {},
): PaddleWebhookDeps & {
  finished: unknown[];
  granted: unknown[];
  consumed: unknown[];
  seatAssignments: string[];
  validateMinAmounts: Array<number | undefined>;
} {
  const finished: unknown[] = [];
  const granted: unknown[] = [];
  const consumed: unknown[] = [];
  const seatAssignments: string[] = [];
  const validateMinAmounts: Array<number | undefined> = [];

  return {
    finished,
    granted,
    consumed,
    seatAssignments,
    validateMinAmounts,
    beginWebhookEvent: async () => ({
      id: "audit-1",
      duplicate: false,
      shouldProcess: true,
    }),
    finishWebhookEvent: async (_id, patch) => {
      finished.push(patch);
    },
    resolveSpecialWebhookMinAmountCents: async () => ({ kind: "default" }),
    validatePaddleTransaction: (payload, options) => {
      validateMinAmounts.push(options?.minAmountCents);
      return {
        ok: true,
        transactionId: payload.data?.id ?? "txn-1",
        amountUsd: 1,
        totalCents: 100,
        customData: payload.data?.custom_data,
      };
    },
    resolveWebhookGrantTarget: async (customData) => ({
      ok: true,
      userId: "user-1",
      taxSeason: "2026",
      intentId: customData?.intentId,
      skuTier: "DEFAULT",
      intentExpiredAtGrant: false,
    }),
    grantPaddleSeasonEntitlement: async (input) => {
      granted.push(input);
      return {
        created: true,
        duplicateSeason: false,
        transactionId: input.transactionId,
      };
    },
    markCheckoutIntentConsumed: async (intentId, transactionId) => {
      consumed.push({ intentId, transactionId });
    },
    assignFounderSeatOnFirstPurchase: async (userId) => {
      seatAssignments.push(userId);
      return { assigned: true, founderNumber: 1, tier: "FOUNDER_LEVEL_SUPER" };
    },
    updateUserFounderStatus: async () => {},
    applySeasonEntitlementAdjustment: async () => ({
      applied: false,
      reason: "txn_not_found",
    }),
    logEvent: () => {},
    currentTaxSeason: () => "2026",
    ...overrides,
  };
}

describe("handlePaddleWebhookPayload", () => {
  it("ignores spoofed SPECIAL custom data when checkout intent resolved a public tier", async () => {
    const deps = testDeps();

    const result = await handlePaddleWebhookPayload(
      completedPayload({ intentId: "intent-default", skuTier: "SPECIAL" }),
      deps,
    );

    assert.deepEqual(result, { ok: true, ignored: true });
    assert.equal(deps.granted.length, 0);
    assert.deepEqual(deps.consumed, []);
    assert.deepEqual(deps.seatAssignments, []);
    assert.deepEqual(deps.finished, [
      {
        processingResult: "ignored",
        processingReason: "sku_tier_mismatch",
        transactionId: "txn-intent-default",
      },
    ]);
  });

  it("grants a valid SPECIAL checkout without assigning a founder seat", async () => {
    const deps = testDeps({
      resolveSpecialWebhookMinAmountCents: async () => ({
        kind: "special",
        minAmountCents: 100,
      }),
      resolveWebhookGrantTarget: async (customData) => ({
        ok: true,
        userId: "user-special",
        taxSeason: "2026",
        intentId: customData?.intentId,
        skuTier: "SPECIAL",
        intentExpiredAtGrant: false,
      }),
    });

    const result = await handlePaddleWebhookPayload(
      completedPayload({ intentId: "intent-special", skuTier: "SPECIAL" }),
      deps,
    );

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(deps.validateMinAmounts, [100]);
    assert.deepEqual(deps.granted, [
      {
        userId: "user-special",
        taxSeason: "2026",
        transactionId: "txn-intent-special",
        amountUsd: 1,
      },
    ]);
    assert.deepEqual(deps.seatAssignments, []);
    assert.deepEqual(deps.consumed, [
      { intentId: "intent-special", transactionId: "txn-intent-special" },
    ]);
    assert.equal(
      (deps.finished[0] as { processingResult: string }).processingResult,
      "applied",
    );
  });

  it("ignores SPECIAL checkout before validation when special price is unconfigured", async () => {
    const deps = testDeps({
      resolveSpecialWebhookMinAmountCents: async () => ({
        kind: "error",
        reason: "special_price_unconfigured",
      }),
    });

    const result = await handlePaddleWebhookPayload(
      completedPayload({ intentId: "intent-special", skuTier: "SPECIAL" }),
      deps,
    );

    assert.deepEqual(result, { ok: true, ignored: true });
    assert.deepEqual(deps.validateMinAmounts, []);
    assert.deepEqual(deps.granted, []);
    assert.deepEqual(deps.finished, [
      {
        processingResult: "ignored",
        processingReason: "special_price_unconfigured",
      },
    ]);
  });
});
