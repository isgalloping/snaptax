import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ONBOARDING_DEMO_RECEIPT_ID } from "@/lib/onboarding/demoReceipt";
import {
  assertPersistedReceiptId,
  isPersistedReceiptId,
  parseClientReceiptId,
} from "./receiptId.ts";

describe("isPersistedReceiptId", () => {
  it("accepts UUID receipt ids", () => {
    assert.equal(
      isPersistedReceiptId("550e8400-e29b-41d4-a716-446655440000"),
      true,
    );
  });

  it("rejects onboarding demo local id", () => {
    assert.equal(isPersistedReceiptId(ONBOARDING_DEMO_RECEIPT_ID), false);
  });

  it("assertPersistedReceiptId throws NOT_FOUND for local ids", () => {
    assert.throws(
      () => assertPersistedReceiptId(ONBOARDING_DEMO_RECEIPT_ID),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.equal(err.message, "NOT_FOUND");
        return true;
      },
    );
  });
});

describe("parseClientReceiptId", () => {
  it("requires a UUID", () => {
    assert.throws(
      () => parseClientReceiptId(null),
      /MISSING_CLIENT_RECEIPT_ID/,
    );
    assert.throws(
      () => parseClientReceiptId("not-a-uuid"),
      /INVALID_CLIENT_RECEIPT_ID/,
    );
    assert.equal(
      parseClientReceiptId("550e8400-e29b-41d4-a716-446655440000"),
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });
});
