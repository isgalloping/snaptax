import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { MAX_WRITE_BUDGET } from "@/lib/client/receiptSyncBudget";
import {
  buildPreparedProcessingReceipt,
  prepareReceiptCapture,
} from "@/lib/client/prepareReceiptCapture";
import { clearAllLocalData } from "@/lib/storage/receiptDb";

const snappedAt = new Date("2026-01-02T03:04:05.000Z");
const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "document",
);
const originalCreateImageBitmapDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "createImageBitmap",
);

function installImageCompressionMocks() {
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: (tagName: string) => {
        assert.equal(tagName, "canvas");
        return {
          width: 0,
          height: 0,
          getContext: (kind: string) =>
            kind === "2d" ? { drawImage: () => undefined } : null,
          toBlob: (callback: (blob: Blob | null) => void) => {
            callback(new Blob(["compressed-receipt"], { type: "image/jpeg" }));
          },
        };
      },
    },
  });
  Object.defineProperty(globalThis, "createImageBitmap", {
    configurable: true,
    value: async () => ({
      width: 1600,
      height: 1200,
      close: () => undefined,
    }),
  });
}

afterEach(async () => {
  if (originalDocumentDescriptor) {
    Object.defineProperty(globalThis, "document", originalDocumentDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "document");
  }
  if (originalCreateImageBitmapDescriptor) {
    Object.defineProperty(
      globalThis,
      "createImageBitmap",
      originalCreateImageBitmapDescriptor,
    );
  } else {
    Reflect.deleteProperty(globalThis, "createImageBitmap");
  }
  await clearAllLocalData();
});

describe("buildPreparedProcessingReceipt", () => {
  it("builds a standard pending receipt without a 1099 capture kind", () => {
    const receipt = buildPreparedProcessingReceipt({
      id: "standard-receipt",
      contentSha256: "sha-standard",
      snappedAt,
    });

    assert.equal(receipt.id, "standard-receipt");
    assert.equal(receipt.status, "processing");
    assert.equal(receipt.merchant, "Scanning");
    assert.equal(receipt.timestamp, snappedAt);
    assert.equal(receipt.updatedAt, snappedAt);
    assert.equal(receipt.pendingUpload, true);
    assert.equal(receipt.contentSha256, "sha-standard");
    assert.equal(receipt.writeBudgetRemaining, MAX_WRITE_BUDGET);
    assert.equal("captureKind" in receipt, false);
  });

  it("persists the 1099 capture kind on the pending receipt", () => {
    const receipt = buildPreparedProcessingReceipt({
      id: "income-receipt",
      contentSha256: "sha-income",
      snappedAt,
      captureKind: "1099-K",
    });

    assert.equal(receipt.captureKind, "1099-K");
    assert.equal(receipt.pendingUpload, true);
    assert.equal(receipt.writeBudgetRemaining, MAX_WRITE_BUDGET);
  });
});

describe("prepareReceiptCapture", () => {
  it("wires a 1099 capture kind into the created pending receipt", async () => {
    installImageCompressionMocks();

    const result = await prepareReceiptCapture(
      new File(["raw receipt bytes"], "receipt.png", { type: "image/png" }),
      { captureKind: "1099-NEC", skipSave: true },
    );

    assert.equal(result.kind, "created");
    if (result.kind !== "created") return;
    assert.equal(result.receipt.captureKind, "1099-NEC");
    assert.equal(result.receipt.status, "processing");
    assert.equal(result.receipt.pendingUpload, true);
    assert.equal(result.receipt.writeBudgetRemaining, MAX_WRITE_BUDGET);
  });
});
