import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyPhotoMissingState,
  captureKindForUpload,
  isPhotoMissingUpload,
  shouldSkipUploadAttempt,
} from "./receiptUploadFlow.ts";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

const baseReceipt = (): StoredReceipt => ({
  id: "local-1",
  status: "processing",
  timestamp: new Date("2026-06-14T12:00:00.000Z"),
  pendingUpload: true,
  writeBudgetRemaining: 5,
});

describe("applyPhotoMissingState", () => {
  it("marks receipt as photo missing with exhausted budget", () => {
    const marked = applyPhotoMissingState(baseReceipt());
    assert.equal(marked.photoMissing, true);
    assert.equal(marked.writeBudgetRemaining, 0);
    assert.equal(marked.pendingUpload, true);
  });
});

describe("shouldSkipUploadAttempt", () => {
  it("skips photo-missing receipts", () => {
    const marked = applyPhotoMissingState(baseReceipt());
    assert.equal(isPhotoMissingUpload(marked), true);
    assert.equal(shouldSkipUploadAttempt(marked), true);
  });

  it("skips sync-stuck receipts", () => {
    const stuck = { ...baseReceipt(), writeBudgetRemaining: 0 };
    assert.equal(shouldSkipUploadAttempt(stuck), true);
  });

  it("allows normal pending uploads", () => {
    assert.equal(shouldSkipUploadAttempt(baseReceipt()), false);
  });
});

describe("captureKindForUpload", () => {
  it("uses the per-receipt pending capture kind for offline upload flushes", () => {
    assert.equal(
      captureKindForUpload({
        ...baseReceipt(),
        captureKind: "1099-NEC",
      }),
      "1099-NEC",
    );
  });

  it("infers capture kind from an existing 1099 category on resnap", () => {
    assert.equal(
      captureKindForUpload({
        ...baseReceipt(),
        category: "1099-K",
      }),
      "1099-K",
    );
  });
});
