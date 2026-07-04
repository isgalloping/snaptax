"use client";

import { homeVisual } from "@/lib/ui/homeVisual";

/** Same footprint as widget pager while founder visibility loads. */
export function WidgetPagerPlaceholder() {
  const card = homeVisual.widgetPager.cardBase;
  const container = homeVisual.widgetPager.container;

  return (
    <div className={container} aria-busy="true" aria-label="Loading tax insights">
      <div className={`${card} animate-pulse border-yellow-500/30 bg-yellow-950/40`} />
    </div>
  );
}
