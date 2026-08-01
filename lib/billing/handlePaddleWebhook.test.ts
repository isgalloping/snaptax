import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handlePaddleWebhookPayload } from "./handlePaddleWebhook.ts";
import {
  WEBHOOK_CHANNEL_PADDLE,
  beginWebhookEvent,
  finishWebhookEvent,
  type WebhookEventStore,
} from "./recordWebhookEvent.ts";

function memoryStore(): WebhookEventStore & {
  rows: Map<string, Record<string, unknown>>;
} {
  const rows = new Map<string, Record<string, unknown>>();
  return {
    rows,
    findUnique: async ({ where }) => {
      const key = `${where.channelCode_eventId.channelCode}:${where.channelCode_eventId.eventId}`;
      const row = rows.get(key);
      return row
        ? {
            id: String(row.id),
            processingResult: String(row.processingResult ?? "received"),
          }
        : null;
    },
    create: async ({ data }) => {
      const id = `evt-${rows.size + 1}`;
      const key = `${data.channelCode}:${data.eventId}`;
      if (rows.has(key)) {
        const err = new Error("unique") as Error & { code?: string };
        err.code = "P2002";
        throw err;
      }
      rows.set(key, { ...data, id });
      return { id };
    },
    update: async ({ where, data }) => {
      for (const [key, row] of rows) {
        if (row.id === where.id) {
          rows.set(key, { ...row, ...data });
          return;
        }
      }
    },
  };
}

function webhookDeps(store: WebhookEventStore, overrides = {}) {
  return {
    beginWebhookEvent: (input: Parameters<typeof beginWebhookEvent>[0]) =>
      beginWebhookEvent(input, store),
    finishWebhookEvent: (
      id: string,
      patch: Parameters<typeof finishWebhookEvent>[1],
    ) => finishWebhookEvent(id, patch, store),
    logEvent: () => {},
    ...overrides,
  };
}

function singleRow(store: ReturnType<typeof memoryStore>) {
  assert.equal(store.rows.size, 1);
  return [...store.rows.values()][0];
}

describe("handlePaddleWebhookPayload", () => {
  it("records an approved refund adjustment as applied and refunded", async () => {
    const store = memoryStore();

    const result = await handlePaddleWebhookPayload(
      {
        event_id: "ntf_refund",
        event_type: "adjustment.updated",
        data: {
          id: "adj_123",
          transaction_id: "txn_refund",
          action: "refund",
          status: "approved",
        },
      },
      webhookDeps(store, {
        applySeasonEntitlementAdjustment: async (input: {
          transactionId: string;
          action: string;
          adjustmentStatus?: string | null;
        }) => {
          assert.deepEqual(input, {
            transactionId: "txn_refund",
            action: "refund",
            adjustmentStatus: "approved",
          });
          return {
            applied: true,
            reason: "refund_approved",
            entitlementId: "ent_123",
            statusBefore: "active",
            statusAfter: "refunded",
          };
        },
      }),
    );

    assert.equal(result.ok, true);
    assert.equal(result.ignored, false);
    const row = singleRow(store);
    assert.equal(row.channelCode, WEBHOOK_CHANNEL_PADDLE);
    assert.equal(row.processingResult, "applied");
    assert.equal(row.processingReason, "refund_approved");
    assert.equal(row.transactionId, "txn_refund");
    assert.equal(row.adjustmentId, "adj_123");
    assert.equal(row.action, "refund");
    assert.equal(row.adjustmentStatus, "approved");
    assert.equal(row.entitlementId, "ent_123");
    assert.equal(row.statusBefore, "active");
    assert.equal(row.statusAfter, "refunded");
  });

  it("ignores forged SPECIAL custom data when the checkout intent is default tier", async () => {
    const store = memoryStore();
    let grantCalls = 0;
    let consumedCalls = 0;

    const result = await handlePaddleWebhookPayload(
      {
        event_id: "ntf_tier_mismatch",
        event_type: "transaction.completed",
        data: {
          id: "txn_mismatch",
          status: "completed",
          custom_data: { intentId: "intent_default", skuTier: "SPECIAL" },
          details: { totals: { total: "4900", currency_code: "USD" } },
        },
      },
      webhookDeps(store, {
        resolveSpecialWebhookMinAmountCents: async () => ({ kind: "default" }),
        resolveWebhookGrantTarget: async () => ({
          ok: true,
          userId: "user_123",
          taxSeason: "2026",
          intentId: "intent_default",
          skuTier: "DEFAULT",
        }),
        grantPaddleSeasonEntitlement: async () => {
          grantCalls += 1;
          throw new Error("should not grant mismatched SPECIAL checkout");
        },
        markCheckoutIntentConsumed: async () => {
          consumedCalls += 1;
        },
      }),
    );

    assert.equal(result.ok, true);
    assert.equal(result.ignored, true);
    assert.equal(grantCalls, 0);
    assert.equal(consumedCalls, 0);
    const row = singleRow(store);
    assert.equal(row.processingResult, "ignored");
    assert.equal(row.processingReason, "sku_tier_mismatch");
    assert.equal(row.transactionId, "txn_mismatch");
  });

  it("grants a valid SPECIAL checkout without assigning a founder seat", async () => {
    const store = memoryStore();
    const consumed: string[] = [];
    const grants: Array<{ userId: string; amountUsd: number }> = [];
    let founderSeatCalls = 0;

    const result = await handlePaddleWebhookPayload(
      {
        event_id: "ntf_special",
        event_type: "transaction.completed",
        data: {
          id: "txn_special",
          status: "completed",
          custom_data: { intentId: "intent_special", skuTier: "SPECIAL" },
          details: { totals: { total: "100", currency_code: "USD" } },
        },
      },
      webhookDeps(store, {
        resolveSpecialWebhookMinAmountCents: async (
          intentId: string | undefined,
        ) => {
          assert.equal(intentId, "intent_special");
          return { kind: "special", minAmountCents: 100 };
        },
        resolveWebhookGrantTarget: async () => ({
          ok: true,
          userId: "user_special",
          taxSeason: "2026",
          intentId: "intent_special",
          skuTier: "SPECIAL",
        }),
        grantPaddleSeasonEntitlement: async (input: {
          userId: string;
          amountUsd: number;
        }) => {
          grants.push({ userId: input.userId, amountUsd: input.amountUsd });
          return {
            created: true,
            duplicateSeason: false,
            transactionId: "txn_special",
          };
        },
        markCheckoutIntentConsumed: async (intentId: string) => {
          consumed.push(intentId);
        },
        assignFounderSeatOnFirstPurchase: async () => {
          founderSeatCalls += 1;
          throw new Error("SPECIAL checkout must not consume founder seats");
        },
      }),
    );

    assert.equal(result.ok, true);
    assert.deepEqual(grants, [{ userId: "user_special", amountUsd: 1 }]);
    assert.deepEqual(consumed, ["intent_special"]);
    assert.equal(founderSeatCalls, 0);
    const row = singleRow(store);
    assert.equal(row.processingResult, "applied");
    assert.equal(row.processingReason, "entitlement_created");
    assert.equal(row.transactionId, "txn_special");
    assert.equal(row.statusAfter, "active");
  });
});
