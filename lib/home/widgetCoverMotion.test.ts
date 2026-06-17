import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  coverFlowTransform,
  focusFromOffset,
  slideOffsetFromCenter,
  trackTranslateX,
} from "./widgetCoverMotion";

describe("widgetCoverMotion", () => {
  it("coverFlowTransform at center", () => {
    const r = coverFlowTransform(0, { reducedMotion: false });
    assert.equal(r.opacity, 1);
    assert.equal(r.zIndex, 2);
    assert.match(r.transform, /scale\(1\)/);
    assert.match(r.transform, /rotateY\(0deg\)/);
    assert.equal(r.height, 112);
  });

  it("coverFlowTransform at side offsets", () => {
    const left = coverFlowTransform(-1, { reducedMotion: false });
    assert.equal(left.opacity, 0.55);
    assert.equal(left.zIndex, 1);
    assert.match(left.transform, /scale\(0\.88\)/);
    assert.match(left.transform, /rotateY\(-8deg\)/);
    assert.equal(left.height, 92);

    const right = coverFlowTransform(1, { reducedMotion: false });
    assert.match(right.transform, /rotateY\(8deg\)/);
  });

  it("coverFlowTransform disables rotateY when reduced motion", () => {
    const r = coverFlowTransform(-1, { reducedMotion: true });
    assert.match(r.transform, /rotateY\(0deg\)/);
    assert.equal(r.opacity, 0.55);
  });

  it("focusFromOffset threshold", () => {
    assert.equal(focusFromOffset(0), "center");
    assert.equal(focusFromOffset(0.2), "center");
    assert.equal(focusFromOffset(0.4), "side");
    assert.equal(focusFromOffset(-0.5), "side");
  });

  it("trackTranslateX centers active slide", () => {
    const viewport = 390;
    const slideW = 140;
    const gap = 6;
    const stride = slideW + gap;
    const t0 = trackTranslateX({
      viewportWidthPx: viewport,
      slideWidthPx: slideW,
      gapPx: gap,
      activeIndex: 0,
      dragOffsetPx: 0,
    });
    assert.equal(t0, viewport / 2 - slideW / 2);

    const t1 = trackTranslateX({
      viewportWidthPx: viewport,
      slideWidthPx: slideW,
      gapPx: gap,
      activeIndex: 1,
      dragOffsetPx: 0,
    });
    assert.equal(t1, viewport / 2 - (stride + slideW / 2));
  });

  it("slideOffsetFromCenter is zero for focal slide", () => {
    const viewport = 390;
    const slideW = 140;
    const gap = 6;
    const tx = trackTranslateX({
      viewportWidthPx: viewport,
      slideWidthPx: slideW,
      gapPx: gap,
      activeIndex: 1,
      dragOffsetPx: 0,
    });
    const offset = slideOffsetFromCenter({
      slideIndex: 1,
      slideWidthPx: slideW,
      gapPx: gap,
      viewportWidthPx: viewport,
      trackTranslateX: tx,
    });
    assert.ok(Math.abs(offset) < 0.001);
  });
});
