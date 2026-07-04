import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeSyncCursor, encodeSyncCursor } from "@/lib/receipts/syncQuery";

describe("syncQuery cursor", () => {
  it("round-trips updatedAt and id", () => {
    const c = encodeSyncCursor(new Date("2026-01-15T00:00:00.000Z"), "uuid");
    const d = decodeSyncCursor(c);
    assert.equal(d.id, "uuid");
    assert.equal(d.updatedAt.toISOString(), "2026-01-15T00:00:00.000Z");
  });
});
