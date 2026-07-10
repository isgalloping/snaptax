import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eventStoreActorWhere } from "@/lib/server/receiptEventStoreCleanup";

describe("eventStoreActorWhere", () => {
  it("scopes deletes to userId and ghostIds", () => {
    assert.deepEqual(eventStoreActorWhere({ userId: "user-1", ghostIds: ["g1"] }), {
      OR: [{ userId: "user-1" }, { ghostId: "g1" }],
    });
  });

  it("returns empty filter when no actor keys", () => {
    assert.deepEqual(eventStoreActorWhere({}), { id: { in: [] } });
  });
});
