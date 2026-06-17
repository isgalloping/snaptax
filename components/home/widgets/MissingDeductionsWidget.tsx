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

  if (data.missing.length === 0) {
    return null;
  }

  const amountLabel = copy.amountInDeductions.replace(
    "{amount}",
    formatCurrency(data.totalTaxEstimate),
  );

  return (
    <div
      className={`rounded-2xl border p-4 ${visual.bg} ${visual.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${visual.accent}`}>
            {copy.label}
          </p>
          <p className="mt-1 text-2xl font-black text-white">{amountLabel}</p>
          <ul className="mt-2 space-y-0.5 text-sm text-zinc-300">
            {data.previewLabels.map((label) => (
              <li key={label} className="flex items-center gap-2">
                <span className="text-green-400" aria-hidden>
                  •
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onReview}
          className="shrink-0 min-h-11 px-2 text-xs font-bold text-white underline decoration-zinc-500 underline-offset-2 transition-transform active:scale-95"
        >
          {copy.review}
        </button>
      </div>
    </div>
  );
}
