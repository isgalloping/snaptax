import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SnaptaxReceipt } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";
import {
  assertReceiptAccess,
  receiptWhereForActor,
} from "@/lib/receipts/ownership";

const userActor: Actor = {
  kind: "user",
  userId: "user-1",
  ghostId: "ghost-1",
  email: "owner@example.com",
};

const ghostActor: Actor = {
  kind: "ghost",
  ghostId: "ghost-1",
  bound: false,
};

function receipt(
  overrides: Pick<SnaptaxReceipt, "ghostId" | "userId">,
): SnaptaxReceipt {
  return overrides as unknown as SnaptaxReceipt;
}

describe("receiptWhereForActor", () => {
  it("scopes user receipt queries by user id only", () => {
    assert.deepEqual(receiptWhereForActor(userActor), { userId: "user-1" });
  });

  it("scopes ghost receipt queries to unbound receipts for that ghost", () => {
    assert.deepEqual(receiptWhereForActor(ghostActor), {
      ghostId: "ghost-1",
      userId: null,
    });
  });
});

describe("assertReceiptAccess", () => {
  it("allows a user to access receipts owned by that user", () => {
    assert.doesNotThrow(() =>
      assertReceiptAccess(
        receipt({ userId: "user-1", ghostId: "ghost-1" }),
        userActor,
      ),
    );
  });

  it("rejects user access to another user's receipt", () => {
    assert.throws(
      () =>
        assertReceiptAccess(
          receipt({ userId: "user-2", ghostId: "ghost-1" }),
          userActor,
        ),
      /NOT_FOUND/,
    );
  });

  it("allows a ghost to access only its own unbound receipts", () => {
    assert.doesNotThrow(() =>
      assertReceiptAccess(
        receipt({ userId: null, ghostId: "ghost-1" }),
        ghostActor,
      ),
    );
  });

  it("rejects ghost access to bound or different-ghost receipts", () => {
    assert.throws(
      () =>
        assertReceiptAccess(
          receipt({ userId: "user-1", ghostId: "ghost-1" }),
          ghostActor,
        ),
      /NOT_FOUND/,
    );
    assert.throws(
      () =>
        assertReceiptAccess(
          receipt({ userId: null, ghostId: "ghost-2" }),
          ghostActor,
        ),
      /NOT_FOUND/,
    );
  });
});
