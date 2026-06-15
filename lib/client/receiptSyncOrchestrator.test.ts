import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeServerReceiptsIntoLocal } from "./receiptSyncOrchestrator.ts";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

const LOCAL_OUTSIDE_WINDOW = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const REMOTE_IN_WINDOW = "550e8400-e29b-41d4-a716-446655440000";
const TOMBSTONED = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

function localRow(id: string): StoredReceipt {
  return {
    id,
    status: "done",
    timestamp: new Date("2026-06-14T12:00:00.000Z"),
    pendingUpload: false,
  };
}

describe("mergeServerReceiptsIntoLocal", () => {
  it("does not drop local rows missing from top-100 remote window", async () => {
    const saved: StoredReceipt[] = [];

    const result = await mergeServerReceiptsIntoLocal([localRow(LOCAL_OUTSIDE_WINDOW)], {
      fetchList: async () => ({
        receipts: [
          {
            id: REMOTE_IN_WINDOW,
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
          },
        ],
        taxSavedEstimate: 2,
      }),
      readTombstones: async () => new Set(),
      loadVisible: async () => saved,
      persistMerged: async (merged) => {
        saved.push(...merged);
      },
    });

    assert.ok(saved.some((r) => r.id === LOCAL_OUTSIDE_WINDOW));
    assert.ok(saved.some((r) => r.id === REMOTE_IN_WINDOW));
    assert.equal(result.taxSavedEstimate, 2);
  });

  it("filters tombstoned remote rows before merge", async () => {
    const saved: StoredReceipt[] = [];

    await mergeServerReceiptsIntoLocal([], {
      fetchList: async () => ({
        receipts: [
          {
            id: TOMBSTONED,
            status: "done",
            amount: 5,
            merchant: "B",
            category: null,
            taxAmount: 1,
            dataRegion: "us",
            capturedAt: "2026-06-14T12:00:00.000Z",
            updatedAt: "2026-06-14T12:00:00.000Z",
            taxSeason: null,
            taxSeasonDate: null,
            hasImage: true,
          },
        ],
        taxSavedEstimate: 1,
      }),
      readTombstones: async () => new Set([TOMBSTONED]),
      loadVisible: async () => saved,
      persistMerged: async (merged) => {
        saved.push(...merged);
      },
    });

    assert.equal(saved.some((r) => r.id === TOMBSTONED), false);
  });
});
