import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateTaxCalculatedReceiptOwnership } from "@/lib/server/validateTaxCalculatedReceiptOwnership";

const ghostActor = { kind: "ghost" as const, ghostId: "ghost-1", bound: false };
const userActor = {
  kind: "user" as const,
  userId: "user-1",
  ghostId: "ghost-1",
};

const taxReceiptA = "00000000-0000-0000-0000-0000000000aa";
const taxReceiptB = "00000000-0000-0000-0000-0000000000bb";

function taxCalculatedEvent(id: string, receiptId: string) {
  return {
    id,
    receiptId,
    type: "TAX_CALCULATED" as const,
    payload: { taxAmount: 12.34 },
    createdAtMs: 100,
  };
}

describe("validateTaxCalculatedReceiptOwnership", () => {
  it("skips the database check when the batch has no TAX_CALCULATED events", async () => {
    const result = await validateTaxCalculatedReceiptOwnership(
      ghostActor,
      [
        {
          id: "00000000-0000-0000-0000-000000000001",
          receiptId: taxReceiptA,
          type: "OCR_COMPLETED" as const,
          payload: {},
          createdAtMs: 100,
        },
      ],
      {
        snaptaxReceipt: {
          count: async () => {
            throw new Error("count should not be called");
          },
        },
      },
    );

    assert.deepEqual(result, { ok: true });
  });

  it("dedupes TAX_CALCULATED receipt ids and scopes the check to the ghost actor", async () => {
    const countCalls: unknown[] = [];
    const result = await validateTaxCalculatedReceiptOwnership(
      ghostActor,
      [
        taxCalculatedEvent("00000000-0000-0000-0000-000000000001", taxReceiptA),
        taxCalculatedEvent("00000000-0000-0000-0000-000000000002", taxReceiptA),
      ],
      {
        snaptaxReceipt: {
          count: async (args: unknown) => {
            countCalls.push(args);
            return 1;
          },
        },
      },
    );

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(countCalls, [
      {
        where: {
          id: { in: [taxReceiptA] },
          ghostId: "ghost-1",
          userId: null,
        },
      },
    ]);
  });

  it("rejects a user TAX_CALCULATED batch when any receipt is not actor-owned", async () => {
    const countCalls: unknown[] = [];
    const result = await validateTaxCalculatedReceiptOwnership(
      userActor,
      [
        taxCalculatedEvent("00000000-0000-0000-0000-000000000001", taxReceiptA),
        taxCalculatedEvent("00000000-0000-0000-0000-000000000002", taxReceiptB),
      ],
      {
        snaptaxReceipt: {
          count: async (args: unknown) => {
            countCalls.push(args);
            return 1;
          },
        },
      },
    );

    assert.deepEqual(result, {
      ok: false,
      code: "INVALID_RECEIPT",
      message: "TAX_CALCULATED events must reference actor-owned receipts",
      status: 403,
    });
    assert.deepEqual(countCalls, [
      {
        where: {
          id: { in: [taxReceiptA, taxReceiptB] },
          userId: "user-1",
        },
      },
    ]);
  });

  it("accepts a user TAX_CALCULATED batch when every receipt is actor-owned", async () => {
    const countCalls: unknown[] = [];
    const result = await validateTaxCalculatedReceiptOwnership(
      userActor,
      [
        taxCalculatedEvent("00000000-0000-0000-0000-000000000001", taxReceiptA),
        taxCalculatedEvent("00000000-0000-0000-0000-000000000002", taxReceiptB),
      ],
      {
        snaptaxReceipt: {
          count: async (args: unknown) => {
            countCalls.push(args);
            return 2;
          },
        },
      },
    );

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(countCalls, [
      {
        where: {
          id: { in: [taxReceiptA, taxReceiptB] },
          userId: "user-1",
        },
      },
    ]);
  });

  it("rejects a ghost TAX_CALCULATED batch when any receipt is bound or belongs to another ghost", async () => {
    const countCalls: unknown[] = [];
    const result = await validateTaxCalculatedReceiptOwnership(
      ghostActor,
      [
        taxCalculatedEvent("00000000-0000-0000-0000-000000000001", taxReceiptA),
        taxCalculatedEvent("00000000-0000-0000-0000-000000000002", taxReceiptB),
      ],
      {
        snaptaxReceipt: {
          count: async (args: unknown) => {
            countCalls.push(args);
            return 1;
          },
        },
      },
    );

    assert.deepEqual(result, {
      ok: false,
      code: "INVALID_RECEIPT",
      message: "TAX_CALCULATED events must reference actor-owned receipts",
      status: 403,
    });
    assert.deepEqual(countCalls, [
      {
        where: {
          id: { in: [taxReceiptA, taxReceiptB] },
          ghostId: "ghost-1",
          userId: null,
        },
      },
    ]);
  });
});
