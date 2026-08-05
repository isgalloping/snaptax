import assert from "node:assert/strict";
import { test } from "node:test";
import type { SnaptaxReceipt } from "@prisma/client";
import { assertReceiptCategoryPatchAllowed, assertReceiptDeleteAllowed, assertReceiptUploadReplaceAllowed } from "./doneReceiptLock.ts";

function receipt(
  overrides: Partial<SnaptaxReceipt> = {},
): SnaptaxReceipt {
  return {
    id: "r1",
    status: "done",
    taxSeason: null,
    taxSeasonDate: null,
    ...overrides,
  } as SnaptaxReceipt;
}

test("assertReceiptCategoryPatchAllowed allows unfiled done receipts", () => {
  assert.doesNotThrow(() =>
    assertReceiptCategoryPatchAllowed(receipt({ status: "done" })),
  );
});

test("assertReceiptCategoryPatchAllowed allows processing receipts", () => {
  assert.doesNotThrow(() =>
    assertReceiptCategoryPatchAllowed(receipt({ status: "processing" })),
  );
});

test("assertReceiptCategoryPatchAllowed rejects filed done receipts", () => {
  assert.throws(
    () =>
      assertReceiptCategoryPatchAllowed(
        receipt({
          taxSeason: "2026",
          taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
        }),
      ),
    /RECEIPT_LOCKED/,
  );
});

test("assertReceiptUploadReplaceAllowed rejects filed receipts", () => {
  assert.throws(
    () =>
      assertReceiptUploadReplaceAllowed(
        receipt({
          taxSeason: "2026",
          taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
        }),
      ),
    /RECEIPT_LOCKED/,
  );
});

test("assertReceiptDeleteAllowed rejects filed receipts", () => {
  assert.throws(
    () =>
      assertReceiptDeleteAllowed(
        receipt({
          taxSeason: "2026",
          taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
        }),
      ),
    /RECEIPT_LOCKED/,
  );
});
