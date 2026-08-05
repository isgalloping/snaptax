import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handlePaddleWebhookPayload } from "./handlePaddleWebhook.ts";

type TestDeps = Parameters<typeof handlePaddleWebhookPayload>[1];

const completedPayload = {
  event_id: "evt-completed",
  event_type: "transaction.completed",
  occurred_at: "2026-07-20T10:00:00.000Z",
  data: {
    id: "txn-123",
    status: "completed",
    custom_data: { intentId: "intent-123" },
    items: [{ price_id: "pri_default" }],
    details: {
      totals: { total: "4900", currency_code: "USD" },
    },
  },
};

describe("handlePaddleWebhookPayload", () => {
  it("finishes duplicate terminal events without re-running transaction grants", async () => {
    let grantCalls = 0;
    const result = await handlePaddleWebhookPayload(completedPayload, {
      beginWebhookEvent: async () => ({
        id: "audit-1",
        duplicate: true,
        shouldProcess: false,
      }),
      grantPaddleSeasonEntitlement: async () => {
        grantCalls += 1;
        return {
          created: true,
          duplicateSeason: false,
          transactionId: "txn-123",
        };
      },
    } satisfies TestDeps);

    assert.deepEqual(result, { ok: true, duplicate: true });
    assert.equal(grantCalls, 0);
  });

  it("ignores SPECIAL custom data when the trusted checkout intent tier is not SPECIAL", async () => {
    const finishes: unknown[] = [];
    let grantCalls = 0;
    const result = await handlePaddleWebhookPayload(
      {
        ...completedPayload,
        data: {
          ...completedPayload.data,
          custom_data: { intentId: "intent-123", skuTier: "SPECIAL" },
        },
      },
      {
        beginWebhookEvent: async () => ({
          id: "audit-2",
          duplicate: false,
          shouldProcess: true,
        }),
        finishWebhookEvent: async (_id, patch) => {
          finishes.push(patch);
        },
        resolveSpecialWebhookMinAmountCents: async () => ({ kind: "default" }),
        validatePaddleTransactionPriceIds: async () => ({ ok: true }),
        resolveWebhookGrantTarget: async () => ({
          ok: true,
          userId: "user-1",
          taxSeason: "2026",
          skuTier: "DEFAULT",
          intentId: "intent-123",
          intentExpiredAtGrant: false,
        }),
        grantPaddleSeasonEntitlement: async () => {
          grantCalls += 1;
          return {
            created: true,
            duplicateSeason: false,
            transactionId: "txn-123",
          };
        },
      } satisfies TestDeps,
    );

    assert.deepEqual(result, { ok: true, ignored: true });
    assert.equal(grantCalls, 0);
    assert.deepEqual(finishes, [
      {
        processingResult: "ignored",
        processingReason: "sku_tier_mismatch",
        transactionId: "txn-123",
      },
    ]);
  });

  it("ignores completed transactions with unexpected Paddle price ids", async () => {
    const finishes: unknown[] = [];
    let grantCalls = 0;
    const result = await handlePaddleWebhookPayload(completedPayload, {
      beginWebhookEvent: async () => ({
        id: "audit-price",
        duplicate: false,
        shouldProcess: true,
      }),
      finishWebhookEvent: async (_id, patch) => {
        finishes.push(patch);
      },
      resolveSpecialWebhookMinAmountCents: async () => ({ kind: "default" }),
      validatePaddleTransactionPriceIds: async () => ({
        ok: false,
        reason: "unexpected_price_id",
      }),
      grantPaddleSeasonEntitlement: async () => {
        grantCalls += 1;
        return {
          created: true,
          duplicateSeason: false,
          transactionId: "txn-123",
        };
      },
    } satisfies TestDeps);

    assert.deepEqual(result, { ok: true, ignored: true });
    assert.equal(grantCalls, 0);
    assert.deepEqual(finishes, [
      {
        processingResult: "ignored",
        processingReason: "unexpected_price_id",
        transactionId: "txn-123",
      },
    ]);
  });

  it("audits applied chargeback adjustments with status transition metadata", async () => {
    const finishes: unknown[] = [];
    const result = await handlePaddleWebhookPayload(
      {
        event_id: "evt-adjustment",
        event_type: "adjustment.updated",
        occurred_at: "2026-07-21T10:00:00.000Z",
        data: {
          id: "adj-123",
          action: "chargeback",
          status: "approved",
          transaction_id: "txn-123",
        },
      },
      {
        beginWebhookEvent: async () => ({
          id: "audit-3",
          duplicate: false,
          shouldProcess: true,
        }),
        finishWebhookEvent: async (_id, patch) => {
          finishes.push(patch);
        },
        applySeasonEntitlementAdjustment: async (input) => {
          assert.deepEqual(input, {
            transactionId: "txn-123",
            action: "chargeback",
            adjustmentStatus: "approved",
          });
          return {
            applied: true,
            reason: "chargeback_approved",
            entitlementId: "ent-123",
            statusBefore: "active",
            statusAfter: "disputed",
          };
        },
      } satisfies TestDeps,
    );

    assert.deepEqual(result, { ok: true, ignored: false });
    assert.deepEqual(finishes, [
      {
        processingResult: "applied",
        processingReason: "chargeback_approved",
        transactionId: "txn-123",
        adjustmentId: "adj-123",
        action: "chargeback",
        adjustmentStatus: "approved",
        entitlementId: "ent-123",
        statusBefore: "active",
        statusAfter: "disputed",
      },
    ]);
  });
});
