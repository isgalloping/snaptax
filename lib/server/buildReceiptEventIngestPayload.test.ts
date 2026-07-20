import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReceiptEventIngestPayload,
  uniqueTaxCalculatedReceiptIds,
} from "@/lib/server/buildReceiptEventIngestPayload";

const ghostActor = { kind: "ghost" as const, ghostId: "ghost-9" };
const userActor = {
  kind: "user" as const,
  userId: "user-1",
  ghostId: "ghost-9",
};

describe("uniqueTaxCalculatedReceiptIds", () => {
  it("dedupes receipt ids from TAX_CALCULATED events", () => {
    const ids = uniqueTaxCalculatedReceiptIds([
      {
        id: "00000000-0000-0000-0000-000000000001",
        receiptId: "00000000-0000-0000-0000-0000000000aa",
        type: "TAX_CALCULATED",
        payload: {},
        createdAtMs: 100,
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        receiptId: "00000000-0000-0000-0000-0000000000aa",
        type: "TAX_CALCULATED",
        payload: {},
        createdAtMs: 200,
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        receiptId: "00000000-0000-0000-0000-0000000000bb",
        type: "OCR_COMPLETED",
        payload: {},
        createdAtMs: 300,
      },
    ]);

    assert.deepEqual(ids, ["00000000-0000-0000-0000-0000000000aa"]);
  });
});

describe("buildReceiptEventIngestPayload", () => {
  it("maps ghost actor keys onto event rows", () => {
    const payload = buildReceiptEventIngestPayload(ghostActor, [
      {
        id: "00000000-0000-0000-0000-000000000001",
        receiptId: "00000000-0000-0000-0000-0000000000aa",
        type: "RECEIPT_CREATED",
        payload: { pendingUpload: true },
        createdAtMs: 100,
      },
    ]);

    assert.equal(payload.rows[0]?.userId, null);
    assert.equal(payload.rows[0]?.ghostId, "ghost-9");
    assert.equal(payload.taxCalculatedEvents.length, 0);
    assert.deepEqual(payload.cursorEvents, [
      {
        id: "00000000-0000-0000-0000-000000000001",
        clientCreatedAtMs: 100,
      },
    ]);
  });

  it("maps user actor and splits TAX_CALCULATED snapshots", () => {
    const payload = buildReceiptEventIngestPayload(userActor, [
      {
        id: "00000000-0000-0000-0000-000000000002",
        receiptId: "00000000-0000-0000-0000-0000000000aa",
        type: "TAX_CALCULATED",
        payload: { taxAmount: 12.5 },
        createdAtMs: 200,
      },
    ]);

    assert.equal(payload.rows[0]?.userId, "user-1");
    assert.equal(payload.rows[0]?.ghostId, "ghost-9");
    assert.deepEqual(payload.taxCalculatedEvents, [
      {
        id: "00000000-0000-0000-0000-000000000002",
        receiptId: "00000000-0000-0000-0000-0000000000aa",
        payload: { taxAmount: 12.5 },
        createdAtMs: 200,
      },
    ]);
  });
});
