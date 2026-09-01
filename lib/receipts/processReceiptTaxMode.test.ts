import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickProcessReceiptTaxRoute } from "@/lib/receipts/processReceiptTaxMode";

describe("pickProcessReceiptTaxRoute", () => {
  it("routes US 1099 captures to the income vision path", () => {
    assert.equal(
      pickProcessReceiptTaxRoute({
        dataRegion: "us",
        captureKind: "1099-NEC",
      }),
      "us_1099_vision",
    );
    assert.equal(
      pickProcessReceiptTaxRoute({
        dataRegion: "us",
        captureKind: "1099-K",
      }),
      "us_1099_vision",
    );
  });

  it("keeps ordinary and EU receipts on the standard tax pipeline", () => {
    assert.equal(
      pickProcessReceiptTaxRoute({
        dataRegion: "us",
        captureKind: null,
      }),
      "standard_receipt_tax",
    );
    assert.equal(
      pickProcessReceiptTaxRoute({
        dataRegion: "us",
      }),
      "standard_receipt_tax",
    );
    assert.equal(
      pickProcessReceiptTaxRoute({
        dataRegion: "eu",
        captureKind: "1099-NEC",
      }),
      "standard_receipt_tax",
    );
    assert.equal(
      pickProcessReceiptTaxRoute({
        dataRegion: "eu",
        captureKind: "1099-K",
      }),
      "standard_receipt_tax",
    );
  });
});
