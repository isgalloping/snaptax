"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { MissingDeductionsResult } from "@/lib/home/computeMissingDeductions";
import { formatCurrency } from "@/lib/format";
import { homeVisual } from "@/lib/ui/homeVisual";

interface MissingDeductionsWidgetProps {
  data: MissingDeductionsResult;
  onReview: () => void;
}

export function MissingDeductionsWidget({ data, onReview }: MissingDeductionsWidgetProps) {
  const copy = useUserCopy().home.widgets.missing;
  const visual = homeVisual.widgets.missing;
  const slide = homeVisual.widgetCarousel.slide;

  if (data.missing.length === 0) {
    return null;
  }

  const amountLabel = copy.amountShort.replace(
    "{amount}",
    formatCurrency(data.totalTaxEstimate),
  );

  return (
    <button
      type="button"
      onClick={onReview}
      className={`${slide} flex flex-col ${visual.bg} ${visual.border} text-left transition-transform active:scale-[0.98]`}
      role="listitem"
    >
      <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${visual.accent}`}>
        {copy.label}
      </p>
      <p className="mt-auto line-clamp-2 text-lg font-black leading-tight text-white">
        {amountLabel}
      </p>
      <span className="mt-0.5 text-[9px] font-bold text-zinc-300 underline decoration-zinc-600 underline-offset-2">
        {copy.review} &gt;
      </span>
    </button>
  );
}
