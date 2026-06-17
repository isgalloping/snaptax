"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { TaxDeadlineInfo } from "@/lib/home/computeTaxDeadline";
import { formatCurrency } from "@/lib/format";
import { OverlayShell } from "./OverlayShell";

const URGENCY_RING: Record<TaxDeadlineInfo["urgency"], string> = {
  safe: "border-green-400 text-green-400",
  attention: "border-yellow-400 text-yellow-400",
  urgent: "border-red-400 text-red-400",
};

interface DeadlineDetailOverlayProps {
  data: TaxDeadlineInfo;
  onBack: () => void;
}

export function DeadlineDetailOverlay({ data, onBack }: DeadlineDetailOverlayProps) {
  const copy = useUserCopy().home.overlays;
  const ringClass = URGENCY_RING[data.urgency];

  const rows = [
    { label: copy.income, value: formatCurrency(data.income) },
    { label: copy.expenses, value: formatCurrency(data.expenses) },
    { label: copy.netProfit, value: formatCurrency(data.netProfit) },
  ];

  return (
    <OverlayShell title={copy.deadlineTitle} onBack={onBack}>
      <div className="flex flex-col items-center gap-8">
        <div
          className={`flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 ${ringClass}`}
        >
          <span className="text-5xl font-black leading-none">{data.daysLeft}</span>
          <span className="mt-2 text-center text-xs font-bold uppercase tracking-widest opacity-90">
            {copy.daysLeft.replace("{days}", "").replace(/\s+/g, " ").trim()}
          </span>
        </div>
        <p className="text-center text-sm font-medium text-zinc-400">{data.quarterLabel}</p>
        <dl className="w-full space-y-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-zinc-800 pb-3"
            >
              <dt className="text-sm font-medium text-zinc-400">{row.label}</dt>
              <dd className="text-lg font-black text-white">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </OverlayShell>
  );
}
