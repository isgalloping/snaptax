"use client";

import type { ReceiptStatusCounts } from "@/lib/receipts/receiptStats";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

export type ReceiptFilter = "all" | "done" | "processing" | "blurry" | "stuck";

interface ReceiptFilterBarProps {
  counts: ReceiptStatusCounts;
  active: ReceiptFilter;
  stuckCount: number;
  onChange: (filter: ReceiptFilter) => void;
}

const FILTERS: {
  id: Exclude<ReceiptFilter, "stuck">;
  icon: string;
  countKey: keyof ReceiptStatusCounts;
}[] = [
  { id: "all", icon: "🧾", countKey: "all" },
  { id: "done", icon: "✓", countKey: "done" },
  { id: "processing", icon: "⚙️", countKey: "processing" },
  { id: "blurry", icon: "❌", countKey: "blurry" },
];

const { padding, fontSize, gap, iconGap, countGap } = homeVisual.filterTab;

const pillBase = `shrink-0 rounded-full font-bold transition-colors ${padding} ${fontSize}`;

export function ReceiptFilterBar({
  counts,
  active,
  stuckCount,
  onChange,
}: ReceiptFilterBarProps) {
  const copy = useUserCopy().home.receiptList;

  return (
    <div className={`mb-2 flex overflow-x-auto pb-1 pr-1 ${gap}`}>
      {FILTERS.map(({ id, icon, countKey }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`${pillBase} ${
              isActive
                ? "bg-yellow-500 text-black"
                : "border border-zinc-700 bg-zinc-800/80 text-zinc-300"
            }`}
          >
            <span className={iconGap}>{icon}</span>
            {copy.filters[id]} ({counts[countKey]})
          </button>
        );
      })}
      {stuckCount > 0 && (
        <button
          type="button"
          onClick={() => onChange("stuck")}
          className={`${pillBase} ${
            active === "stuck"
              ? "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500"
              : "border border-zinc-700 bg-zinc-800/80 text-zinc-300"
          }`}
          aria-label={`${copy.filters.stuckAria} (${stuckCount})`}
        >
          ⚠️
          <span className={`${countGap} tabular-nums`}>({stuckCount})</span>
        </button>
      )}
    </div>
  );
}
