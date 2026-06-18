import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seasonCoverageEndLabel } from "@/lib/settings/seasonCoverage";

describe("seasonCoverage", () => {
  it("formats Apr 15 for season year", () => {
    assert.equal(seasonCoverageEndLabel("2027"), "Apr 15, 2027");
  });
});
