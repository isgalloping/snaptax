import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CLOUD_RESTORE_ATTEMPTED_KEY,
  shouldAutoRestoreFromCloud,
} from "./localDataLoss.ts";

describe("shouldAutoRestoreFromCloud", () => {
  it("returns false when local receipts exist", async () => {
    const result = await shouldAutoRestoreFromCloud({
      loadAllReceipts: async () => [{ id: "r1" } as never],
      readSystemMeta: async () => null,
      isOnline: () => true,
    });
    assert.equal(result, false);
  });

  it("returns false when restore was already attempted", async () => {
    const result = await shouldAutoRestoreFromCloud({
      loadAllReceipts: async () => [],
      readSystemMeta: async (key) =>
        key === CLOUD_RESTORE_ATTEMPTED_KEY ? "1" : null,
      isOnline: () => true,
    });
    assert.equal(result, false);
  });

  it("returns false when offline", async () => {
    const result = await shouldAutoRestoreFromCloud({
      loadAllReceipts: async () => [],
      readSystemMeta: async () => null,
      isOnline: () => false,
    });
    assert.equal(result, false);
  });

  it("returns true when empty local store, not attempted, online", async () => {
    const result = await shouldAutoRestoreFromCloud({
      loadAllReceipts: async () => [],
      readSystemMeta: async () => null,
      isOnline: () => true,
    });
    assert.equal(result, true);
  });
});
