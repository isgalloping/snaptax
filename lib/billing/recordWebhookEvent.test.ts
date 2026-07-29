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
      return row
        ? {
            id: String(row.id),
            processingResult: String(row.processingResult ?? "received"),
          }
        : null;
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
    assert.equal(first.shouldProcess, true);
    const row = [...store.rows.values()][0];
    assert.equal(row.channelCode, WEBHOOK_CHANNEL_PADDLE);
  });

  it("returns shouldProcess false for terminal duplicate", async () => {
    const store = memoryStore();
    const input = {
      channelCode: "paddle",
      eventId: "ntf_1",
      eventType: "transaction.completed",
      payload: {},
    };
    const first = await beginWebhookEvent(input, store);
    await finishWebhookEvent(
      first.id,
      { processingResult: "applied", processingReason: "ok" },
      store,
    );
    const second = await beginWebhookEvent(input, store);
    assert.equal(second.duplicate, true);
    assert.equal(second.shouldProcess, false);
    assert.equal(store.rows.size, 1);
  });

  it("resumes stuck received duplicates", async () => {
    const store = memoryStore();
    const input = {
      channelCode: "paddle",
      eventId: "ntf_stuck",
      eventType: "adjustment.updated",
      payload: {},
    };
    const first = await beginWebhookEvent(input, store);
    assert.equal(first.shouldProcess, true);
    const second = await beginWebhookEvent(input, store);
    assert.equal(second.duplicate, true);
    assert.equal(second.shouldProcess, true);
    assert.equal(second.id, first.id);
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
