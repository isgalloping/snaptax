"use client";

import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import { TaxDeadlineWidget } from "./TaxDeadlineWidget";
import { MissingDeductionsWidget } from "./MissingDeductionsWidget";
import { TaxYearProgressWidget } from "./TaxYearProgressWidget";
import { CpaReadyWidget } from "./CpaReadyWidget";

interface WidgetStackProps {
  data: HomeWidgetsData;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onExport: () => void;
}

export function WidgetStack({
  data,
  onDeadlineDetails,
  onMissingReview,
  onExport,
}: WidgetStackProps) {
  return (
    <div className="flex flex-col gap-3 px-4 pt-3">
      <TaxDeadlineWidget data={data.deadline} onViewDetails={onDeadlineDetails} />
      <MissingDeductionsWidget data={data.missing} onReview={onMissingReview} />
      <TaxYearProgressWidget data={data.progress} />
      <CpaReadyWidget count={data.cpaReadyCount} onExport={onExport} />
    </div>
  );
}
