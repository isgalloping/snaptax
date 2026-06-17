"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { TaxYearProgressResult } from "@/lib/home/computeTaxYearProgress";
import { homeVisual } from "@/lib/ui/homeVisual";

interface TaxYearProgressWidgetProps {
  data: TaxYearProgressResult;
  focus: "side" | "center";
}

function ProgressArc({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const dash = (clamped / 100) * 88;

  return (
    <div className="relative mx-auto mt-1 h-11 w-full max-w-[88px]">
      <svg viewBox="0 0 88 48" className="h-full w-full" aria-hidden>
        <path
          d="M 8 40 A 36 36 0 0 1 80 40"
          fill="none"
          stroke="rgb(39 39 42)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 8 40 A 36 36 0 0 1 80 40"
          fill="none"
          stroke="rgb(96 165 250)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} 88`}
        />
      </svg>
      <span className="absolute inset-x-0 bottom-0 text-center text-sm font-black text-white">
        {clamped}%
      </span>
    </div>
  );
}

export function TaxYearProgressWidget({ data, focus }: TaxYearProgressWidgetProps) {
  const copy = useUserCopy().home.widgets.progress;
  const visual = homeVisual.widgets.progress;
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
        {copy.label.replace("{year}", String(data.year))}
      </p>
      {centered ? (
        <>
          <ProgressArc pct={data.progressPct} />
          <p className="mt-auto text-center text-[10px] font-medium text-zinc-300">
            {copy.percentShort.replace("{pct}", String(data.progressPct))}
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-[11px] font-semibold text-zinc-200">
            {copy.percentShort.replace("{pct}", String(data.progressPct))}
          </p>
          <div className="mt-auto h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-400 transition-all"
              style={{ width: `${data.progressPct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
