import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterIdsByTombstones } from "./receiptDeleteTombstones.ts";

describe("filterIdsByTombstones", () => {
  it("removes tombstoned ids", () => {
    const tombstones = new Set(["a", "b"]);
    assert.deepEqual(filterIdsByTombstones(["a", "c", "b"], tombstones), ["c"]);
  });
});
