"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { MissingDeductionsResult } from "@/lib/home/computeMissingDeductions";
import { formatCurrency } from "@/lib/format";
import { homeVisual } from "@/lib/ui/homeVisual";

interface MissingDeductionsWidgetProps {
  data: MissingDeductionsResult;
  focus: "side" | "center";
}

export function MissingDeductionsWidget({ data, focus }: MissingDeductionsWidgetProps) {
  const copy = useUserCopy().home.widgets.missing;
  const visual = homeVisual.widgets.missing;
  const centered = focus === "center";

  if (data.missing.length === 0) {
    return null;
  }

  const amountLabel = copy.amountShort.replace(
    "{amount}",
    formatCurrency(data.totalTaxEstimate),
  );

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
      <p
        className={`mt-auto font-black leading-tight text-white ${
          centered ? "text-xl" : "text-base"
        }`}
      >
        {amountLabel}
      </p>
      {centered && data.previewLabels[0] && (
        <p className="mt-1 truncate text-[10px] text-zinc-300">
          <span className="text-green-400" aria-hidden>
            •{" "}
          </span>
          {data.previewLabels[0]}
        </p>
      )}
      {centered && (
        <span className="mt-0.5 text-[9px] font-bold text-zinc-300 underline decoration-zinc-600 underline-offset-2">
          {copy.review} &gt;
        </span>
      )}
    </div>
  );
}
