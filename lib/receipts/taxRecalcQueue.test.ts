import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { taxRecalcReceiptWhere } from "./taxRecalcQueue.ts";
import { unfiledReceiptWhere } from "./filedStatus.ts";

describe("taxRecalcReceiptWhere", () => {
  it("only selects unfiled done/processing receipts for a user", () => {
    assert.deepEqual(taxRecalcReceiptWhere("user-1"), {
      userId: "user-1",
      status: { in: ["done", "processing"] },
      ...unfiledReceiptWhere(),
    });
  });
});
