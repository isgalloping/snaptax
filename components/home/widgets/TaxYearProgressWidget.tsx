"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { TaxYearProgressResult } from "@/lib/home/computeTaxYearProgress";
import { formatCurrency } from "@/lib/format";
import { homeVisual } from "@/lib/ui/homeVisual";

const EMPTY_AMOUNT = "$—";

interface TaxYearProgressWidgetProps {
  data: TaxYearProgressResult;
}

export function TaxYearProgressWidget({ data }: TaxYearProgressWidgetProps) {
  const copy = useUserCopy().home.widgets.progress;
  const visual = homeVisual.widgets.progress;
  const savingsLabel =
    data.projectedSavings != null
      ? copy.projectedSavings.replace("{amount}", formatCurrency(data.projectedSavings))
      : copy.projectedSavings.replace("{amount}", EMPTY_AMOUNT);

  return (
    <div
      className={`rounded-2xl border p-4 ${visual.bg} ${visual.border}`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-wider ${visual.accent}`}>
        {copy.label.replace("{year}", String(data.year))}
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-300">
        {copy.percentComplete.replace("{pct}", String(data.progressPct))}
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-blue-400 transition-all"
          style={{ width: `${data.progressPct}%` }}
        />
      </div>
      <p className="mt-3 text-lg font-black text-white">{savingsLabel}</p>
    </div>
  );
}
