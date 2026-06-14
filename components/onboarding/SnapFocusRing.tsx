"use client";

import { homeVisual } from "@/lib/ui/homeVisual";

export const SNAP_FOCUS_RING_CLASS = "snap-focus-ring";

export function SnapFocusRing() {
  return (
    <div
      className={`${SNAP_FOCUS_RING_CLASS} pointer-events-none absolute inset-x-0 top-0 z-10 ${homeVisual.snap.height} ${homeVisual.snap.maxHeight} rounded-2xl`}
      aria-hidden
    >
      <div className="snap-focus-ring__pulse absolute inset-0 rounded-2xl" />
    </div>
  );
}
