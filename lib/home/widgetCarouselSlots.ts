export type WidgetSlideId = "deadline" | "missing" | "progress";

export function buildWidgetSlides(showMissing: boolean): WidgetSlideId[] {
  const slides: WidgetSlideId[] = ["deadline"];
  if (showMissing) slides.push("missing");
  slides.push("progress");
  return slides;
}

export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function adjacentIndex(
  index: number,
  delta: -1 | 1,
  length: number,
): number {
  return wrapIndex(index + delta, length);
}

/** [left, center, right] slide indices for cover-flow triple display. */
export function carouselTriple(
  activeIndex: number,
  length: number,
): [number, number, number] {
  if (length <= 0) return [0, 0, 0];
  if (length === 1) return [0, 0, 0];
  if (length === 2) {
    const center = wrapIndex(activeIndex, length);
    const side = center === 0 ? 1 : 0;
    return [side, center, side];
  }
  return [
    adjacentIndex(activeIndex, -1, length),
    wrapIndex(activeIndex, length),
    adjacentIndex(activeIndex, 1, length),
  ];
}

export function swipeDirection(
  deltaX: number,
  threshold = 40,
): -1 | 1 | null {
  if (Math.abs(deltaX) < threshold) return null;
  return deltaX < 0 ? 1 : -1;
}
