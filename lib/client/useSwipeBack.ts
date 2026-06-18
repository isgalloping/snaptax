import { useEffect, useRef } from "react";

export const DEFAULT_SWIPE_BACK_THRESHOLD_PX = 60;
export const SWIPE_BACK_HORIZONTAL_RATIO = 1.5;

export function shouldTriggerSwipeBack(
  dx: number,
  dy: number,
  thresholdPx = DEFAULT_SWIPE_BACK_THRESHOLD_PX,
): boolean {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx < thresholdPx) return false;
  return absDx > absDy * SWIPE_BACK_HORIZONTAL_RATIO;
}

interface UseSwipeBackOptions {
  onBack: () => void;
  enabled?: boolean;
  thresholdPx?: number;
}

export function useSwipeBack({
  onBack,
  enabled = true,
  thresholdPx = DEFAULT_SWIPE_BACK_THRESHOLD_PX,
}: UseSwipeBackOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (event: TouchEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (shouldTriggerSwipeBack(dx, dy, thresholdPx)) {
        onBackRef.current();
      }
    };

    const onTouchCancel = () => {
      startRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [enabled, thresholdPx]);

  return containerRef;
}
