import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reconcileNonDoneWindow } from "./reconcileNonDoneWindow.ts";
import type { ApiReceipt } from "./receiptApi.ts";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

const PENDING_ID = "550e8400-e29b-41d4-a716-446655440000";

function localRow(overrides: Partial<StoredReceipt> = {}): StoredReceipt {
  return {
    id: PENDING_ID,
    status: "processing",
    timestamp: new Date("2026-06-14T12:00:00.000Z"),
    pendingUpload: true,
    merchant: "Local",
    ...overrides,
  };
}

function serverRow(overrides: Partial<ApiReceipt> = {}): ApiReceipt {
  return {
    id: PENDING_ID,
    status: "done",
    amount: 100,
    merchant: "Server",
    category: "FUEL",
    taxAmount: 25,
    dataRegion: "us",
    capturedAt: "2026-06-14T12:00:00.000Z",
    updatedAt: "2026-06-15T12:00:00.000Z",
    taxSeason: null,
    taxSeasonDate: null,
    hasImage: true,
    ...overrides,
  };
}

describe("reconcileNonDoneWindow", () => {
  it("does not overwrite local row when pendingUpload", async () => {
    const local = [localRow()];
    let saved: StoredReceipt | undefined;
    let rebuilt = false;

    const count = await reconcileNonDoneWindow({
      loadAllReceipts: async () => local,
      fetchReconcile: async () => ({ receipts: [serverRow()] }),
      saveReceipt: async (row) => {
        saved = row;
      },
      rebuildSummary: async () => {
        rebuilt = true;
      },
    });

    assert.equal(saved, undefined);
    assert.equal(rebuilt, false);
    assert.equal(count, 0);
    assert.equal(local[0]?.status, "processing");
    assert.equal(local[0]?.merchant, "Local");
  });
});
