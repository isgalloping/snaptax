"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { TaxYearProgressResult } from "@/lib/home/computeTaxYearProgress";
import { formatCurrency } from "@/lib/format";
import { OverlayShell } from "./OverlayShell";

const EMPTY_AMOUNT = "$—";

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

interface TaxYearDetailOverlayProps {
  data: TaxYearProgressResult;
  onBack: () => void;
}

export function TaxYearDetailOverlay({ data, onBack }: TaxYearDetailOverlayProps) {
  const copy = useUserCopy().home.overlays;
  const totalDays = isLeapYear(data.year) ? 366 : 365;
  const elapsedDays = Math.min(
    totalDays,
    Math.max(0, Math.round((data.progressPct / 100) * totalDays)),
  );
  const savingsLabel =
    data.projectedSavings != null
      ? formatCurrency(data.projectedSavings)
      : EMPTY_AMOUNT;

  return (
    <OverlayShell title={copy.taxYearTitle.replace("{year}", String(data.year))} onBack={onBack}>
      <div className="flex flex-col items-center gap-8">
        <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-blue-400 text-blue-400">
          <span className="text-5xl font-black leading-none">{data.progressPct}%</span>
          <span className="mt-2 text-center text-xs font-bold uppercase tracking-widest opacity-90">
            {copy.yearComplete}
          </span>
        </div>
        <p className="text-center text-sm font-medium text-zinc-400">
          {copy.percentOfYear.replace("{pct}", String(data.progressPct))}
        </p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-400 transition-all"
            style={{ width: `${data.progressPct}%` }}
          />
        </div>
        <dl className="w-full space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <dt className="text-sm font-medium text-zinc-400">{copy.daysElapsed}</dt>
            <dd className="text-lg font-black text-white">
              {copy.daysElapsedValue
                .replace("{elapsed}", String(elapsedDays))
                .replace("{total}", String(totalDays))}
            </dd>
          </div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <dt className="text-sm font-medium text-zinc-400">{copy.projectedSavingsLabel}</dt>
            <dd className="text-lg font-black text-white">{savingsLabel}</dd>
          </div>
        </dl>
      </div>
    </OverlayShell>
  );
}
