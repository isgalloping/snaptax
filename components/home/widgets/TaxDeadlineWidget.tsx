"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { TaxDeadlineInfo } from "@/lib/home/computeTaxDeadline";
import { homeVisual } from "@/lib/ui/homeVisual";

const URGENCY_TEXT: Record<TaxDeadlineInfo["urgency"], string> = {
  safe: "text-green-400",
  attention: "text-yellow-400",
  urgent: "text-red-400",
};

interface TaxDeadlineWidgetProps {
  data: TaxDeadlineInfo;
  onViewDetails: () => void;
}

export function TaxDeadlineWidget({ data, onViewDetails }: TaxDeadlineWidgetProps) {
  const copy = useUserCopy().home.widgets.deadline;
  const visual = homeVisual.widgets.deadline;
  const urgencyClass = URGENCY_TEXT[data.urgency];
  const card = homeVisual.widgetPager.cardBase;

  return (
    <button
      type="button"
      onClick={onViewDetails}
      className={`${card} flex flex-col ${visual.bg} ${visual.border} text-left transition-transform active:scale-[0.98]`}
    >
      <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${visual.accent}`}>
        {copy.label}
      </p>
      <p className="mt-1 truncate text-[10px] font-medium text-zinc-400">
        {data.quarterLabel}
      </p>
      <p className={`mt-auto text-xl font-black leading-tight ${urgencyClass}`}>
        {copy.daysShort.replace("{days}", String(data.daysLeft))}
      </p>
      <span className="mt-0.5 text-[9px] font-bold text-zinc-300 underline decoration-zinc-600 underline-offset-2">
        {copy.viewDetails} &gt;
      </span>
    </button>
  );
}
