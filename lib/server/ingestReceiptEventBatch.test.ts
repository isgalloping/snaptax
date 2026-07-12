import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ingestReceiptEventBatch } from "@/lib/server/ingestReceiptEventBatch";

const ghostActor = { kind: "ghost" as const, ghostId: "ghost-9" };

describe("ingestReceiptEventBatch", () => {
  it("writes events, snapshots, and cursor in order", async () => {
    const order: string[] = [];

    const result = await ingestReceiptEventBatch(
      {
        actor: ghostActor,
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            receiptId: "00000000-0000-0000-0000-0000000000aa",
            ghostId: "ghost-9",
            userId: null,
            eventType: "RECEIPT_CREATED",
            payload: {},
            clientCreatedAt: new Date(100),
          },
          {
            id: "00000000-0000-0000-0000-000000000002",
            receiptId: "00000000-0000-0000-0000-0000000000aa",
            ghostId: "ghost-9",
            userId: null,
            eventType: "TAX_CALCULATED",
            payload: { taxAmount: 12.5 },
            clientCreatedAt: new Date(200),
          },
        ],
        cursorEvents: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            clientCreatedAtMs: 100,
          },
          {
            id: "00000000-0000-0000-0000-000000000002",
            clientCreatedAtMs: 200,
          },
        ],
        taxCalculatedEvents: [
          {
            id: "00000000-0000-0000-0000-000000000002",
            receiptId: "00000000-0000-0000-0000-0000000000aa",
            payload: { taxAmount: 12.5 },
            createdAtMs: 200,
          },
        ],
      },
      {
        snaptaxReceiptEvent: {
          createMany: async () => {
            order.push("events");
            return { count: 2 };
          },
        },
        snaptaxReceiptLifecycleSnapshot: {
          createMany: async () => {
            order.push("snapshots");
            return { count: 1 };
          },
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async () => null,
          upsert: async () => {
            order.push("cursor");
            return {};
          },
          deleteMany: async () => ({ count: 0 }),
        },
        $transaction: async () => {
          throw new Error("should not use $transaction when db is injected");
        },
      },
    );

    assert.deepEqual(order, ["events", "snapshots", "cursor"]);
    assert.equal(result.inserted, 2);
    assert.equal(result.snapshotsInserted, 1);
    assert.deepEqual(result.cursor, {
      lastEventId: "00000000-0000-0000-0000-000000000002",
      lastClientCreatedAtMs: 200,
    });
  });

  it("skips snapshots when batch has no TAX_CALCULATED events", async () => {
    let snapshotCalls = 0;

    const result = await ingestReceiptEventBatch(
      {
        actor: ghostActor,
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000003",
            receiptId: "00000000-0000-0000-0000-0000000000bb",
            ghostId: "ghost-9",
            userId: null,
            eventType: "OCR_COMPLETED",
            payload: { skipped: true },
            clientCreatedAt: new Date(300),
          },
        ],
        cursorEvents: [
          {
            id: "00000000-0000-0000-0000-000000000003",
            clientCreatedAtMs: 300,
          },
        ],
        taxCalculatedEvents: [],
      },
      {
        snaptaxReceiptEvent: {
          createMany: async () => ({ count: 1 }),
        },
        snaptaxReceiptLifecycleSnapshot: {
          createMany: async () => {
            snapshotCalls += 1;
            return { count: 0 };
          },
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async () => null,
          upsert: async () => ({}),
          deleteMany: async () => ({ count: 0 }),
        },
        $transaction: async () => {
          throw new Error("should not use $transaction when db is injected");
        },
      },
    );

    assert.equal(snapshotCalls, 0);
    assert.equal(result.snapshotsInserted, 0);
    assert.equal(result.inserted, 1);
  });
});
