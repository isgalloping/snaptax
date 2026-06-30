import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterTombstonedReceipts } from "./cloudRestoreFlow.ts";
import type { ApiReceipt } from "./receiptApi.ts";

const TOMBSTONED = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const KEPT = "550e8400-e29b-41d4-a716-446655440000";

function apiReceipt(id: string): ApiReceipt {
  return {
    id,
    status: "done",
    amount: 10,
    merchant: "A",
    category: null,
    taxAmount: 2,
    dataRegion: "us",
    capturedAt: "2026-06-14T12:00:00.000Z",
    updatedAt: "2026-06-14T12:00:00.000Z",
    taxSeason: null,
    taxSeasonDate: null,
    hasImage: true,
  };
}

describe("filterTombstonedReceipts", () => {
  it("excludes tombstoned ids from merge list", () => {
    const receipts = [apiReceipt(TOMBSTONED), apiReceipt(KEPT)];
    const filtered = filterTombstonedReceipts(
      receipts,
      new Set([TOMBSTONED]),
    );

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.id, KEPT);
  });

  it("returns empty when all ids are tombstoned", () => {
    const receipts = [apiReceipt(TOMBSTONED)];
    const filtered = filterTombstonedReceipts(
      receipts,
      new Set([TOMBSTONED]),
    );

    assert.deepEqual(filtered, []);
  });
});
