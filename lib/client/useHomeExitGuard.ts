"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import {
  isEdgeTouchStart,
  shouldTriggerEdgeExitSwipe,
} from "@/lib/client/homeExitGuard";

interface UseHomeExitGuardOptions {
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onEdgeSwipeExit: () => void;
}

export function useHomeExitGuard({
  enabled,
  containerRef,
  onEdgeSwipeExit,
}: UseHomeExitGuardOptions) {
  const enabledRef = useRef(enabled);
  const onEdgeSwipeExitRef = useRef(onEdgeSwipeExit);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onEdgeSwipeExitRef.current = onEdgeSwipeExit;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const startRef = { current: null as { x: number; y: number } | null };

    const onTouchStart = (event: TouchEvent) => {
      if (!enabledRef.current || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!isEdgeTouchStart(touch.clientX, window.innerWidth)) return;
      startRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (event: TouchEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start || !enabledRef.current) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (shouldTriggerEdgeExitSwipe(dx, dy)) {
        onEdgeSwipeExitRef.current();
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
  }, [containerRef, enabled]);
}
