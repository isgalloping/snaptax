import assert from "node:assert/strict";
import { test } from "node:test";
import { RECEIPT_SYNC_LIMIT, UI_RECEIPT_LIMIT } from "./receiptWindow.ts";

test("UI sync window is 50 rows", () => {
  assert.equal(UI_RECEIPT_LIMIT, 50);
  assert.equal(RECEIPT_SYNC_LIMIT, 50);
});
