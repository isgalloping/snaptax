"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { TaxDeadlineInfo } from "@/lib/home/computeTaxDeadline";
import { formatCurrency } from "@/lib/format";
import { homeVisual } from "@/lib/ui/homeVisual";

const EMPTY_AMOUNT = "$—";

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
  const paymentLabel =
    data.projectedPayment != null
      ? copy.projectedPayment.replace("{amount}", formatCurrency(data.projectedPayment))
      : copy.projectedPayment.replace("{amount}", EMPTY_AMOUNT);

  return (
    <div
      className={`rounded-2xl border p-4 ${visual.bg} ${visual.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${visual.accent}`}>
            {copy.label}
          </p>
          <p className={`mt-1 text-2xl font-black ${urgencyClass}`}>
            {copy.dueInDays.replace("{days}", String(data.daysLeft))}
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-300">{data.quarterLabel}</p>
          <p className="mt-2 text-sm font-semibold text-zinc-200">{paymentLabel}</p>
        </div>
        <button
          type="button"
          onClick={onViewDetails}
          className="shrink-0 min-h-11 px-2 text-xs font-bold text-white underline decoration-zinc-500 underline-offset-2 transition-transform active:scale-95"
        >
          {copy.viewDetails}
        </button>
      </div>
    </div>
  );
}
