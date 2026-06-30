import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCenterRoiCrop,
  OCR_ROI_ASPECT_THRESHOLD,
  OCR_ROI_CENTER_RATIO,
} from "@/lib/ocr/preprocessImage";

describe("computeCenterRoiCrop", () => {
  it("returns null for square images", () => {
    assert.equal(computeCenterRoiCrop(1000, 1000), null);
  });

  it("returns null when aspect is below threshold", () => {
    assert.equal(
      computeCenterRoiCrop(1800, 1000, OCR_ROI_CENTER_RATIO, OCR_ROI_ASPECT_THRESHOLD),
      null,
    );
  });

  it("returns center 85% crop for tall receipt aspect > 2:1", () => {
    const crop = computeCenterRoiCrop(800, 2000);
    assert.ok(crop);
    assert.equal(crop.sw, Math.round(800 * OCR_ROI_CENTER_RATIO));
    assert.equal(crop.sh, Math.round(2000 * OCR_ROI_CENTER_RATIO));
    assert.equal(crop.sx, Math.round((800 - crop.sw) / 2));
    assert.equal(crop.sy, Math.round((2000 - crop.sh) / 2));
  });
});
