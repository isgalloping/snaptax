const SIDE_SCALE = 0.88;
const SIDE_OPACITY = 0.55;
const SIDE_TRANSLATE_Y_PX = 4;
const SIDE_ROTATE_Y_DEG = 8;
const CENTER_HEIGHT_PX = 112;
const SIDE_HEIGHT_PX = 92;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Math.abs(value)));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
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
  const transform = `translateY(${translateY}px) rotateY(${rotateDeg}deg) scale(${scale})`;
  const zIndex = Math.abs(offset) < 0.5 ? 2 : 1;
  return { transform, opacity, zIndex, height };
}

export function focusFromOffset(offset: number): "side" | "center" {
  return Math.abs(offset) < 0.35 ? "center" : "side";
}

/** Combine fixed slot role (−1 / 0 / +1) with drag fraction for follow-finger motion. */
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
