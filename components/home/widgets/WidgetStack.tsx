"use client";

import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import { homeVisual } from "@/lib/ui/homeVisual";
import { TaxDeadlineWidget } from "./TaxDeadlineWidget";
import { MissingDeductionsWidget } from "./MissingDeductionsWidget";
import { TaxYearProgressWidget } from "./TaxYearProgressWidget";
import { CpaReadyWidget } from "./CpaReadyWidget";

interface WidgetStackProps {
  data: HomeWidgetsData;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onProgressDetails: () => void;
  onExport: () => void;
}

export function WidgetCarousel({
  data,
  onDeadlineDetails,
  onMissingReview,
  onProgressDetails,
}: Omit<WidgetStackProps, "onExport">) {
  const showMissing = data.missing.missing.length > 0;

  return (
    <div className={homeVisual.widgetCarousel.track} role="list" aria-label="Tax insights">
      <TaxDeadlineWidget data={data.deadline} onViewDetails={onDeadlineDetails} />
      {showMissing && (
        <MissingDeductionsWidget data={data.missing} onReview={onMissingReview} />
      )}
      <TaxYearProgressWidget data={data.progress} onOpenDetails={onProgressDetails} />
    </div>
  );
}

export function WidgetStack({
  data,
  onDeadlineDetails,
  onMissingReview,
  onProgressDetails,
  onExport,
}: WidgetStackProps) {
  return (
    <div className="flex flex-col gap-3">
      <WidgetCarousel
        data={data}
        onDeadlineDetails={onDeadlineDetails}
        onMissingReview={onMissingReview}
        onProgressDetails={onProgressDetails}
      />
      {data.showCpaReady && (
        <div className="px-4">
          <CpaReadyWidget count={data.cpaReadyCount} onExport={onExport} />
        </div>
      )}
    </div>
  );
}
