import { adjacentIndex, wrapIndex } from "./widgetCarouselSlots";

const SIDE_SCALE = 0.88;
const SIDE_OPACITY = 0.55;
const SIDE_TRANSLATE_Y_PX = 4;
const SIDE_ROTATE_Y_DEG = 8;
const CENTER_HEIGHT_PX = 112;
const SIDE_HEIGHT_PX = 92;

export const COVER_FLOW_DURATION_MS = 400;
const VISIBLE_OFFSET_MAX = 1.2;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Math.abs(value)));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function circularOffset(
  slideIndex: number,
  displayIndex: number,
  count: number,
): number {
  if (count <= 0) return 0;
  let raw = slideIndex - displayIndex;
  const half = count / 2;
  while (raw > half) raw -= count;
  while (raw < -half) raw += count;
  return raw;
}

export interface SlidePlacement {
  slideIndex: number;
  offset: number;
  key: string;
}

export function buildSlidePlacements(
  displayIndex: number,
  count: number,
): SlidePlacement[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [{ slideIndex: 0, offset: 0, key: "0" }];
  }
  if (count === 2) {
    const k = Math.floor(displayIndex);
    const t = displayIndex - k;
    const center = ((k % 2) + 2) % 2;
    const other = 1 - center;
    const placements: SlidePlacement[] = [];
    const add = (slideIndex: number, offset: number, key: string) => {
      if (Math.abs(offset) <= VISIBLE_OFFSET_MAX) {
        placements.push({ slideIndex, offset, key });
      }
    };
    add(center, -t, `c-${center}`);
    add(other, 1 - t, `o-r-${other}`);
    add(other, -1 + t, `o-l-${other}`);
    return placements;
  }
  if (count === 3) {
    const k = Math.floor(displayIndex);
    const t = displayIndex - k;
    const active = wrapIndex(k, count);
    const left = adjacentIndex(active, -1, count);
    const right = adjacentIndex(active, 1, count);
    const placements: SlidePlacement[] = [];
    const add = (slideIndex: number, offset: number, key: string) => {
      if (Math.abs(offset) <= VISIBLE_OFFSET_MAX) {
        placements.push({ slideIndex, offset, key });
      }
    };
    add(active, -t, `c-${active}`);
    add(left, -1 - t, `l-${left}`);
    add(right, 1 - t, `r-${right}`);
    return placements;
  }
  const placements: SlidePlacement[] = [];
  for (let i = 0; i < count; i++) {
    const offset = circularOffset(i, displayIndex, count);
    if (Math.abs(offset) <= VISIBLE_OFFSET_MAX) {
      placements.push({ slideIndex: i, offset, key: String(i) });
    }
  }
  return placements;
}

/** Pick the float displayIndex endpoint that animates shortest from `from`. */
export function resolveAnimationTarget(
  from: number,
  targetIndex: number,
  count: number,
  direction?: -1 | 1,
): number {
  const candidates = [targetIndex, targetIndex + count, targetIndex - count];
  if (direction != null) {
    const directed = candidates.filter(
      (c) => c === from || Math.sign(c - from) === direction,
    );
    if (directed.length > 0) {
      return directed.reduce((best, c) =>
        Math.abs(c - from) < Math.abs(best - from) ? c : best,
      );
    }
  }
  return candidates.reduce((best, c) =>
    Math.abs(c - from) < Math.abs(best - from) ? c : best,
  );
}

export function coverFlowTransform(
  offset: number,
  options: { reducedMotion: boolean },
): { transform: string; opacity: number; zIndex: number; height: number } {
  const t = clamp01(offset);
  const scale = lerp(1, SIDE_SCALE, t);
  const opacity = lerp(1, SIDE_OPACITY, t);
  const translateY = lerp(0, SIDE_TRANSLATE_Y_PX, t);
  const rotateDeg =
    options.reducedMotion || offset === 0
      ? 0
      : (offset < 0 ? -1 : 1) * lerp(0, SIDE_ROTATE_Y_DEG, t);
  const height = lerp(CENTER_HEIGHT_PX, SIDE_HEIGHT_PX, t);
  const transform = `translateX(-50%) translateY(${translateY}px) rotateY(${rotateDeg}deg) scale(${scale})`;
  const zIndex = Math.abs(offset) < 0.5 ? 2 : 1;
  return { transform, opacity, zIndex, height };
}

export function focusFromOffset(offset: number): "side" | "center" {
  return Math.abs(offset) < 0.35 ? "center" : "side";
}

/** @deprecated Triple-slot drag helper — retained for tests. */
export function slotOffset(baseOffset: number, dragFraction: number): number {
  return baseOffset + dragFraction;
}

export function trackTranslateX(params: {
  viewportWidthPx: number;
  slideWidthPx: number;
  gapPx: number;
  activeIndex: number;
  dragOffsetPx: number;
}): number {
  const stride = params.slideWidthPx + params.gapPx;
  const slideCenter = params.activeIndex * stride + params.slideWidthPx / 2;
  return params.viewportWidthPx / 2 - slideCenter + params.dragOffsetPx;
}

export function slideOffsetFromCenter(params: {
  slideIndex: number;
  slideWidthPx: number;
  gapPx: number;
  viewportWidthPx: number;
  trackTranslateX: number;
}): number {
  const stride = params.slideWidthPx + params.gapPx;
  const slideCenterInViewport =
    params.slideIndex * stride +
    params.slideWidthPx / 2 +
    params.trackTranslateX;
  return (slideCenterInViewport - params.viewportWidthPx / 2) / stride;
}

/** Ease-out cubic — no overshoot; used for displayIndex interpolation. */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** @deprecated Use easeOutCubic for index; retained for visual spring experiments. */
export function coverFlowEase(t: number): number {
  const c1 = 1.15;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}
