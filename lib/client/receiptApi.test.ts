import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apiReceiptFromUploadResponse } from "./receiptApi.ts";

describe("apiReceiptFromUploadResponse", () => {
  it("maps 201 upload body without requiring GET", () => {
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
});
