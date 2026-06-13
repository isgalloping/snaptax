import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bypassTransactionId } from "./bypassTransactionId";

describe("bypassTransactionId", () => {
  it("builds stable verify_bypass id", () => {
    assert.equal(
      bypassTransactionId("user-uuid", "2026"),
      "verify_bypass_user-uuid_2026",
    );
  });
});
