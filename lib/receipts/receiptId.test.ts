import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ONBOARDING_DEMO_RECEIPT_ID } from "@/lib/onboarding/demoReceipt";
import {
  assertPersistedReceiptId,
  isPersistedReceiptId,
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
