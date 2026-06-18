import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSlidePlacements,
  circularOffset,
  coverFlowTransform,
  focusFromOffset,
  resolveAnimationTarget,
  slideOffsetFromCenter,
  slotOffset,
  trackTranslateX,
} from "./widgetCoverMotion";

describe("widgetCoverMotion", () => {
  it("coverFlowTransform at center", () => {
    const r = coverFlowTransform(0, { reducedMotion: false });
    assert.equal(r.opacity, 1);
    assert.equal(r.zIndex, 2);
    assert.match(r.transform, /scale\(1\)/);
    assert.match(r.transform, /rotateY\(0deg\)/);
    assert.match(r.transform, /translateX\(-50%\)/);
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

  it("circularOffset wraps for three slides", () => {
    assert.equal(circularOffset(0, 0, 3), 0);
    assert.equal(circularOffset(2, 0, 3), -1);
    assert.equal(circularOffset(1, 0, 3), 1);
    assert.ok(Math.abs(circularOffset(1, 0.5, 3) - 0.5) < 0.001);
  });

  it("buildSlidePlacements keeps three peeks when displayIndex overshoots", () => {
    const stuck = buildSlidePlacements(1.08, 3);
    assert.equal(stuck.length, 3);
    const offsets = stuck.map((p) => p.offset).sort((a, b) => a - b);
    assert.ok(offsets[0]! < -0.9);
    assert.ok(Math.abs(offsets[1]!) < 0.2);
    assert.ok(offsets[2]! > 0.8);
  });

  it("buildSlidePlacements fills three peeks at rest", () => {
    const atZero = buildSlidePlacements(0, 3);
    assert.equal(atZero.length, 3);
    const offsets = atZero
      .map((p) => p.offset)
      .map((v) => (Object.is(v, -0) ? 0 : v))
      .sort((a, b) => a - b);
    assert.deepEqual(offsets, [-1, 0, 1]);
  });

  it("buildSlidePlacements mirrors two slides", () => {
    const atZero = buildSlidePlacements(0, 2);
    assert.equal(atZero.length, 3);
    assert.ok(atZero.some((p) => p.slideIndex === 0 && p.offset === 0));
    assert.ok(
      atZero.filter((p) => p.slideIndex === 1).every((p) => Math.abs(p.offset) === 1),
    );
  });

  it("resolveAnimationTarget picks shortest wrap path", () => {
    assert.equal(resolveAnimationTarget(0, 2, 3, -1), -1);
    assert.equal(resolveAnimationTarget(2, 0, 3, 1), 3);
  });

  it("slotOffset combines base role with drag fraction", () => {
    assert.equal(slotOffset(-1, 0.5), -0.5);
    assert.equal(slotOffset(0, -0.25), -0.25);
    assert.equal(slotOffset(1, 0), 1);
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
