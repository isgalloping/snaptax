import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  landingVariantFromStatus,
  readLandingVariantMirror,
} from "./landingVariant.ts";

describe("landingVariantFromStatus", () => {
  it("maps onboarding status to landing variant", () => {
    assert.equal(landingVariantFromStatus("not_started"), "hero");
    assert.equal(landingVariantFromStatus("stage_1"), "none");
    assert.equal(landingVariantFromStatus("stage_4"), "none");
    assert.equal(landingVariantFromStatus("completed"), "data_stream");
  });
});

describe("readLandingVariantMirror", () => {
  it("defaults to hero when mirror unavailable", () => {
    assert.equal(readLandingVariantMirror(), "hero");
  });
});
