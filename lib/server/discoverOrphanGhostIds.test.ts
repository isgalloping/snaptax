import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discoverOrphanGhostIds } from "@/lib/server/discoverOrphanGhostIds";

describe("discoverOrphanGhostIds", () => {
  it("collects server-derived ghosts minus current", () => {
    const ids = discoverOrphanGhostIds({
      currentGhostId: "ghost-new",
      rebindPreviousGhostId: "ghost-old",
      historicalGhostIds: ["ghost-hist", "ghost-new"],
    });

    assert.deepEqual(ids.sort(), ["ghost-hist", "ghost-old"]);
  });

  it("returns empty when only current ghost is known", () => {
    assert.deepEqual(
      discoverOrphanGhostIds({
        currentGhostId: "ghost-9",
        rebindPreviousGhostId: null,
        historicalGhostIds: [],
      }),
      [],
    );
  });
});
