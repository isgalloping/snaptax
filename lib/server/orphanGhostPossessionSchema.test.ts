import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orphanGhostsBodyField } from "@/lib/server/orphanGhostPossessionSchema";

describe("orphanGhostsBodyField", () => {
  it("defaults missing orphan proofs to an empty array", () => {
    assert.deepEqual(orphanGhostsBodyField.parse(undefined), []);
  });

  it("accepts at most 20 client possession proofs", () => {
    const proofs = Array.from({ length: 20 }, (_, index) => ({
      ghostId: `ghost-${index}`,
      token: `token-${index}`,
    }));

    assert.deepEqual(orphanGhostsBodyField.parse(proofs), proofs);
  });

  it("rejects empty proof fields and oversized batches", () => {
    assert.throws(() =>
      orphanGhostsBodyField.parse([{ ghostId: "", token: "token-1" }]),
    );
    assert.throws(() =>
      orphanGhostsBodyField.parse([{ ghostId: "ghost-1", token: "" }]),
    );
    assert.throws(() =>
      orphanGhostsBodyField.parse(
        Array.from({ length: 21 }, (_, index) => ({
          ghostId: `ghost-${index}`,
          token: `token-${index}`,
        })),
      ),
    );
  });
});
