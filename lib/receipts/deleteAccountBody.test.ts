import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deleteAccountBodySchema } from "./deleteAccountBody.ts";

describe("deleteAccountBodySchema", () => {
  it("defaults orphanGhostIds to empty", () => {
    assert.deepEqual(deleteAccountBodySchema.parse({}).orphanGhostIds, []);
  });

  it("accepts up to 20 orphan ids", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `g-${i}`);
    assert.deepEqual(
      deleteAccountBodySchema.parse({ orphanGhostIds: ids }).orphanGhostIds,
      ids,
    );
  });

  it("rejects more than 20 orphan ids", () => {
    const ids = Array.from({ length: 21 }, (_, i) => `g-${i}`);
    assert.throws(() =>
      deleteAccountBodySchema.parse({ orphanGhostIds: ids }),
    );
  });
});
