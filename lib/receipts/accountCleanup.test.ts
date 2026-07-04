import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { userAccountReceiptFilter } from "./accountCleanup.ts";

describe("userAccountReceiptFilter", () => {
  it("scopes to userId when no ghost binding or historical ghosts", () => {
    assert.deepEqual(userAccountReceiptFilter("user-1", null, []), {
      userId: "user-1",
    });
  });

  it("includes bound ghost orphan receipts when binding exists", () => {
    assert.deepEqual(userAccountReceiptFilter("user-1", "ghost-9", []), {
      OR: [{ userId: "user-1" }, { ghostId: "ghost-9", userId: null }],
    });
  });

  it("includes historical ghost orphan receipts after rebind", () => {
    const filter = userAccountReceiptFilter("user-1", "ghost-new", ["ghost-old"]);
    assert.deepEqual(filter.OR?.[0], { userId: "user-1" });
    const ghostClauses = (filter.OR ?? []).slice(1) as Array<{
      ghostId: string;
      userId: null;
    }>;
    assert.equal(ghostClauses.length, 2);
    const ghostIds = ghostClauses.map((clause) => clause.ghostId).sort();
    assert.deepEqual(ghostIds, ["ghost-new", "ghost-old"]);
    assert.ok(ghostClauses.every((clause) => clause.userId === null));
  });

  it("deduplicates bound ghost id when also present in historical list", () => {
    const filter = userAccountReceiptFilter("user-1", "ghost-9", ["ghost-9"]);
    assert.deepEqual(filter, {
      OR: [{ userId: "user-1" }, { ghostId: "ghost-9", userId: null }],
    });
  });
});
