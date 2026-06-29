import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setPendingIncomeCapture } from "@/lib/export/incomeCapture";
import { resolveUploadCaptureKind } from "./receiptApi.ts";

function withSessionStorage(fn: () => void): void {
  const original = globalThis.sessionStorage;
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem(key: string) {
        return values.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        values.set(key, value);
      },
      removeItem(key: string) {
        values.delete(key);
      },
    },
  });
  try {
    fn();
  } finally {
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: original,
    });
  }
}

describe("resolveUploadCaptureKind", () => {
  it("does not use legacy pending capture when caller passes explicit null", () => {
    withSessionStorage(() => {
      setPendingIncomeCapture("1099-NEC");

      const resolved = resolveUploadCaptureKind(null);

      assert.deepEqual(resolved, { captureKind: null, fromPending: false });
    });
  });

  it("uses legacy pending capture only when capture kind is omitted", () => {
    withSessionStorage(() => {
      setPendingIncomeCapture("1099-K");

      const resolved = resolveUploadCaptureKind(undefined);

      assert.deepEqual(resolved, { captureKind: "1099-K", fromPending: true });
    });
  });
});
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apiReceiptFromUploadResponse } from "./receiptApi.ts";

describe("apiReceiptFromUploadResponse", () => {
  it("maps slim 201 upload body without requiring GET", () => {
    const snapAt = new Date("2026-06-14T12:00:00.000Z");
    const receipt = apiReceiptFromUploadResponse(
      {
        id: "server-id",
        status: "processing",
        taxAmount: 0,
        dataRegion: "us",
        processFailed: true,
      },
      snapAt,
    );

    assert.equal(receipt.id, "server-id");
    assert.equal(receipt.status, "processing");
    assert.equal(receipt.taxAmount, 0);
    assert.equal(receipt.dataRegion, "us");
    assert.equal(receipt.hasImage, true);
    assert.equal(receipt.snapAt, "2026-06-14T12:00:00.000Z");
    assert.equal(receipt.merchant, null);
  });

  it("maps full 201 upload body with merchant and category", () => {
    const receipt = apiReceiptFromUploadResponse({
      id: "server-id",
      status: "done",
      taxAmount: 2.95,
      dataRegion: "us",
      merchant: "Home Depot",
      category: "OTHER",
      amount: 14.75,
      capturedAt: "2026-06-16T12:00:00.000Z",
      updatedAt: "2026-06-16T12:00:05.000Z",
      hasImage: true,
    });

    assert.equal(receipt.merchant, "Home Depot");
    assert.equal(receipt.category, "OTHER");
    assert.equal(receipt.amount, 14.75);
    assert.equal(receipt.updatedAt, "2026-06-16T12:00:05.000Z");
  });
});
