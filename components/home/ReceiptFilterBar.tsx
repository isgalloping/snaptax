"use client";

import type { BucketCounts, ReceiptListFilter } from "@/lib/receipts/receiptBucket";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

interface ReceiptFilterBarProps {
  counts: BucketCounts;
  active: ReceiptListFilter;
  onChange: (filter: ReceiptListFilter) => void;
}

const FILTERS: {
  id: ReceiptListFilter;
  icon: string;
  countKey: keyof BucketCounts;
}[] = [
  { id: "all", icon: "🧾", countKey: "all" },
  { id: "ready", icon: "✓", countKey: "ready" },
  { id: "review", icon: "👀", countKey: "review" },
  { id: "action", icon: "❌", countKey: "action" },
  { id: "processing", icon: "⚙️", countKey: "processing" },
];

const ACTIVE: Record<ReceiptListFilter, string> = {
  all: "bg-yellow-500 text-black",
  ready: "bg-green-600 text-white ring-2 ring-green-500/50",
  review: "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500",
  action: "bg-red-600/90 text-white ring-2 ring-red-500/50",
  processing: "bg-zinc-700 text-zinc-200 ring-2 ring-blue-500/40",
};

const { padding, fontSize, gap, iconGap } = homeVisual.filterTab;

const pillBase = `shrink-0 rounded-full font-bold transition-colors ${padding} ${fontSize}`;

export function ReceiptFilterBar({
  counts,
  active,
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
                ? ACTIVE[id]
                : "border border-zinc-700 bg-zinc-800/80 text-zinc-300"
            }`}
          >
            <span className={iconGap}>{icon}</span>
            {copy.filters[id]} ({counts[countKey]})
          </button>
        );
      })}
    </div>
  );
}
