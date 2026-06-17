"use client";

import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import { CpaReadyWidget } from "./CpaReadyWidget";
import { WidgetCoverCarousel } from "./WidgetCoverCarousel";

interface WidgetInsightsProps {
  data: HomeWidgetsData;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onProgressDetails: () => void;
}

/** Fixed chrome: cover-flow carousel between header and trust bar. */
export function WidgetInsightsRail({
  data,
  onDeadlineDetails,
  onMissingReview,
  onProgressDetails,
}: WidgetInsightsProps) {
  return (
    <WidgetCoverCarousel
      data={data}
      onDeadlineDetails={onDeadlineDetails}
      onMissingReview={onMissingReview}
      onProgressDetails={onProgressDetails}
    />
  );
}

interface WidgetCpaBelowSnapProps {
  data: HomeWidgetsData;
  onExport: () => void;
}

export function WidgetCpaBelowSnap({ data, onExport }: WidgetCpaBelowSnapProps) {
  if (!data.showCpaReady) return null;
  return (
    <div className="shrink-0 px-4 pb-2 pt-1">
      <CpaReadyWidget count={data.cpaReadyCount} onExport={onExport} />
    </div>
  );
}
