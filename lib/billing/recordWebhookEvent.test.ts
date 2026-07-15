import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
      return row ? { id: String(row.id) } : null;
    },
    create: async ({ data }) => {
      const id = `evt-${rows.size + 1}`;
      const channelCode = String(data.channelCode);
      const eventId = String(data.eventId);
      const key = `${channelCode}:${eventId}`;
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

describe("beginWebhookEvent", () => {
  it("normalizes channel to paddle and inserts", async () => {
    const store = memoryStore();
    const first = await beginWebhookEvent(
      {
        channelCode: "PADDLE",
        eventId: "ntf_1",
        eventType: "adjustment.updated",
        payload: { ok: true },
      },
      store,
    );
    assert.equal(first.duplicate, false);
    const row = [...store.rows.values()][0];
    assert.equal(row.channelCode, WEBHOOK_CHANNEL_PADDLE);
  });

  it("returns duplicate for same event id", async () => {
    const store = memoryStore();
    const input = {
      channelCode: "paddle",
      eventId: "ntf_1",
      eventType: "transaction.completed",
      payload: {},
    };
    await beginWebhookEvent(input, store);
    const second = await beginWebhookEvent(input, store);
    assert.equal(second.duplicate, true);
    assert.equal(store.rows.size, 1);
  });
});

describe("finishWebhookEvent", () => {
  it("updates processing fields", async () => {
    const store = memoryStore();
    const { id } = await beginWebhookEvent(
      {
        channelCode: "paddle",
        eventId: "ntf_2",
        eventType: "adjustment.created",
        payload: {},
      },
      store,
    );
    await finishWebhookEvent(
      id,
      {
        processingResult: "applied",
        processingReason: "refund_approved",
        statusBefore: "active",
        statusAfter: "refunded",
      },
      store,
    );
    const row = [...store.rows.values()][0];
    assert.equal(row.processingResult, "applied");
    assert.equal(row.statusAfter, "refunded");
  });
});
