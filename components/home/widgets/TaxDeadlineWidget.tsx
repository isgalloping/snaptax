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
  focus: "side" | "center";
}

export function TaxDeadlineWidget({ data, focus }: TaxDeadlineWidgetProps) {
  const copy = useUserCopy().home.widgets.deadline;
  const visual = homeVisual.widgets.deadline;
  const urgencyClass = URGENCY_TEXT[data.urgency];
  const centered = focus === "center";

  return (
    <div
      className={`flex h-full w-full flex-col rounded-2xl border p-2.5 text-left ${visual.bg} ${visual.border} ${
        centered ? "p-3" : ""
      }`}
    >
      <p
        className={`font-bold uppercase tracking-wider leading-none ${visual.accent} ${
          centered ? "text-[9px]" : "text-[8px]"
        }`}
      >
        {copy.label}
      </p>
      {centered && (
        <p className="mt-1 truncate text-[10px] font-medium text-zinc-400">
          {data.quarterLabel}
        </p>
      )}
      <p
        className={`mt-auto font-black leading-tight ${urgencyClass} ${
          centered ? "text-2xl" : "text-lg"
        }`}
      >
        {copy.daysShort.replace("{days}", String(data.daysLeft))}
      </p>
      {centered && (
        <span className="mt-0.5 text-[9px] font-bold text-zinc-300 underline decoration-zinc-600 underline-offset-2">
          {copy.viewDetails} &gt;
        </span>
      )}
    </div>
  );
}
