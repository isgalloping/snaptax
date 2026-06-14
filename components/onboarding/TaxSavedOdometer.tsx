"use client";

import { useEffect, useState } from "react";

export function useTaxOdometer(
  active: boolean,
  from: number,
  to: number,
  durationMs = 300,
): number | null {
  const [value, setValue] = useState<number | null>(active ? from : null);

  useEffect(() => {
    if (!active) {
      setValue(null);
      return;
    }

    setValue(from);
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(from + (to - from) * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, from, to, durationMs]);

  return value;
}
