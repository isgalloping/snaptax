"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { TaxYearProgressResult } from "@/lib/home/computeTaxYearProgress";
import { homeVisual } from "@/lib/ui/homeVisual";

interface TaxYearProgressWidgetProps {
  data: TaxYearProgressResult;
  onOpenDetails: () => void;
}

export function TaxYearProgressWidget({ data, onOpenDetails }: TaxYearProgressWidgetProps) {
  const copy = useUserCopy().home.widgets.progress;
  const visual = homeVisual.widgets.progress;
  const card = homeVisual.widgetPager.cardBase;

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      className={`${card} flex flex-col ${visual.bg} ${visual.border} text-left transition-transform active:scale-[0.98]`}
      role="listitem"
    >
      <p className={`text-[9px] font-bold uppercase tracking-wider leading-none ${visual.accent}`}>
        {copy.label.replace("{year}", String(data.year))}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-zinc-200">
        {copy.percentShort.replace("{pct}", String(data.progressPct))}
      </p>
      <div className="mt-auto h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-400 transition-all"
          style={{ width: `${data.progressPct}%` }}
        />
      </div>
    </button>
  );
}
