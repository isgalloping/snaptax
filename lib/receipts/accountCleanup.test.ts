import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { userAccountReceiptFilter } from "./accountCleanup.ts";

describe("userAccountReceiptFilter", () => {
  it("scopes to userId when no ghost binding", () => {
    assert.deepEqual(userAccountReceiptFilter("user-1", null), {
      userId: "user-1",
    });
  });

  it("includes bound ghost receipts when binding exists", () => {
    assert.deepEqual(userAccountReceiptFilter("user-1", "ghost-9"), {
      OR: [{ userId: "user-1" }, { ghostId: "ghost-9" }],
    });
  });
});
