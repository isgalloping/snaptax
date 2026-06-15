import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ProcessingReceiptWatcher } from "./processingReceiptWatcher.ts";
import type { ApiReceipt } from "./receiptApi.ts";

const ACTIVE_ID = "550e8400-e29b-41d4-a716-446655440000";

function processingReceipt(): ApiReceipt {
  return {
    id: ACTIVE_ID,
    status: "processing",
    amount: null,
    merchant: null,
    category: null,
    taxAmount: 0,
    dataRegion: "us",
    capturedAt: "2026-06-14T12:00:00.000Z",
    updatedAt: "2026-06-14T12:00:00.000Z",
    taxSeason: null,
    taxSeasonDate: null,
    hasImage: true,
  };
}

describe("ProcessingReceiptWatcher", () => {
  it("polls active receipt by id even when absent from list window", async () => {
    let pollPhase = 0;
    let fetchByIdCalls = 0;
    let listCalls = 0;
    let updated: ApiReceipt | null = null;

    const watcher = new ProcessingReceiptWatcher(
      {
        onReceiptUpdate: (receipt) => {
          updated = receipt;
        },
        onReceiptStuck: () => {},
        getWriteBudget: () => 5,
        onWriteFailure: () => {},
        onTaxSaved: () => {},
      },
      {
        fetchReceipt: async (id) => {
          fetchByIdCalls += 1;
          if (id !== ACTIVE_ID) return null;
          pollPhase += 1;
          if (pollPhase === 1) return processingReceipt();
          return { ...processingReceipt(), status: "done", taxAmount: 3 };
        },
        fetchList: async () => {
          listCalls += 1;
          return { receipts: [], taxSavedEstimate: 3 };
        },
        triggerProcess: async () => ({ ok: true }),
      },
      10_000,
    );

    watcher.watch(ACTIVE_ID);
    await watcher.tickOnce();

    assert.equal(fetchByIdCalls, 1);
    assert.equal(listCalls, 0);
    assert.equal(updated, null);

    await watcher.tickOnce();

    assert.equal(fetchByIdCalls, 2);
    assert.equal(listCalls, 1);
    assert.equal(updated?.status, "done");
    watcher.dispose();
  });

  it("unwatches when single-receipt fetch returns null", async () => {
    const watcher = new ProcessingReceiptWatcher(
      {
        onReceiptUpdate: () => {},
        onReceiptStuck: () => {},
        getWriteBudget: () => 5,
        onWriteFailure: () => {},
      },
      {
        fetchReceipt: async () => null,
        fetchList: async () => ({ receipts: [], taxSavedEstimate: 0 }),
        triggerProcess: async () => ({ ok: true }),
      },
    );

    watcher.watch(ACTIVE_ID);
    await watcher.tickOnce();
    watcher.dispose();
  });
});
