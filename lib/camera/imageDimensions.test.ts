import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitInsideDimensions } from "@/lib/camera/imageDimensions";

describe("fitInsideDimensions", () => {
  it("scales 4032x3024 to max edge 1280", () => {
    const r = fitInsideDimensions(4032, 3024, 1280);
    assert.equal(r.width, 1280);
    assert.equal(r.height, 960);
  });

  it("does not upscale small images", () => {
    const r = fitInsideDimensions(800, 600, 1280);
    assert.equal(r.width, 800);
    assert.equal(r.height, 600);
  });
});
