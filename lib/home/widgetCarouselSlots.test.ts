import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adjacentIndex,
  buildWidgetSlides,
  carouselTriple,
  swipeDirection,
  wrapIndex,
} from "./widgetCarouselSlots";

describe("widgetCarouselSlots", () => {
  it("buildWidgetSlides omits missing when empty", () => {
    assert.deepEqual(buildWidgetSlides(false), ["deadline", "progress"]);
    assert.deepEqual(buildWidgetSlides(true), [
      "deadline",
      "missing",
      "progress",
    ]);
  });

  it("carouselTriple wraps for three slides", () => {
    assert.deepEqual(carouselTriple(0, 3), [2, 0, 1]);
    assert.deepEqual(carouselTriple(1, 3), [0, 1, 2]);
    assert.deepEqual(carouselTriple(2, 3), [1, 2, 0]);
  });

  it("carouselTriple handles two slides", () => {
    assert.deepEqual(carouselTriple(0, 2), [1, 0, 1]);
    assert.deepEqual(carouselTriple(1, 2), [0, 1, 0]);
  });

  it("adjacentIndex and wrapIndex", () => {
    assert.equal(adjacentIndex(0, -1, 3), 2);
    assert.equal(wrapIndex(-1, 3), 2);
  });

  it("swipeDirection threshold", () => {
    assert.equal(swipeDirection(-50), 1);
    assert.equal(swipeDirection(50), -1);
    assert.equal(swipeDirection(10), null);
  });
});
