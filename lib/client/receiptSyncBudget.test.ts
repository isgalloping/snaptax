import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_WRITE_BUDGET,
  getBudget,
  recordWriteFailure,
  resetBudget,
  isSyncStuck,
  withFreshBudget,
} from "@/lib/client/receiptSyncBudget";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

function receipt(overrides: Partial<StoredReceipt> = {}): StoredReceipt {
  return {
    id: "r1",
    status: "processing",
    merchant: "Test",
    timestamp: new Date("2026-06-07T12:00:00.000Z"),
    ...overrides,
  };
}

test("getBudget defaults to MAX when field omitted", () => {
  assert.equal(getBudget(receipt()), MAX_WRITE_BUDGET);
});

test("recordWriteFailure decrements until zero", () => {
  let r = withFreshBudget(receipt());
  for (let i = MAX_WRITE_BUDGET - 1; i >= 0; i--) {
    r = recordWriteFailure(r);
    assert.equal(getBudget(r), i);
  }
  assert.equal(getBudget(r), 0);
  assert.equal(isSyncStuck(r), true);
});

test("resetBudget restores MAX", () => {
  let r = receipt({ writeBudgetRemaining: 0 });
  r = resetBudget(r);
  assert.equal(getBudget(r), MAX_WRITE_BUDGET);
  assert.equal(isSyncStuck(r), false);
});
