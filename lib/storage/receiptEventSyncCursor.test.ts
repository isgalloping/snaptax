import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceReceiptSyncCursor } from "@/lib/server/receiptSyncCursor";

describe("receiptEventSyncCursor", () => {
  it("advanceReceiptSyncCursor merges with stored cursor state", () => {
    const stored = {
      lastEventId: "00000000-0000-0000-0000-000000000005",
      lastClientCreatedAtMs: 500,
    };
    const next = advanceReceiptSyncCursor(stored, [
      { id: "00000000-0000-0000-0000-000000000006", clientCreatedAtMs: 450 },
      { id: "00000000-0000-0000-0000-000000000007", clientCreatedAtMs: 550 },
    ]);
    assert.deepEqual(next, {
      lastEventId: "00000000-0000-0000-0000-000000000007",
      lastClientCreatedAtMs: 550,
    });
  });
});
