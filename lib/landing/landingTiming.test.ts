import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveExit } from "./landingTiming.ts";

describe("resolveExit by landing variant", () => {
  it("data_stream waits for min hold and chunk", () => {
    assert.equal(resolveExit(1000, true, "data_stream"), null);
    assert.equal(resolveExit(2400, true, "data_stream"), "full-home");
  });

  it("hero exits only on CTA or soft max", () => {
    assert.equal(resolveExit(3000, true, "hero"), null);
    assert.equal(resolveExit(5000, true, "hero"), "full-home");
  });

  it("none exits when chunk is ready", () => {
    assert.equal(resolveExit(0, true, "none"), "full-home");
    assert.equal(resolveExit(0, false, "none"), null);
  });
});
