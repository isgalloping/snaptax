"use client";

import type { ReceiptStatusCounts } from "@/lib/receipts/receiptStats";

export type ReceiptFilter = "all" | "done" | "processing" | "blurry";

interface ReceiptFilterBarProps {
  counts: ReceiptStatusCounts;
  active: ReceiptFilter;
  onChange: (filter: ReceiptFilter) => void;
}

const FILTERS: {
  id: ReceiptFilter;
  label: string;
  icon?: string;
  countKey: keyof ReceiptStatusCounts;
}[] = [
  { id: "all", label: "All", countKey: "all" },
  { id: "done", label: "Ready", icon: "✓", countKey: "done" },
  { id: "processing", label: "Processing", icon: "⚙️", countKey: "processing" },
  { id: "blurry", label: "Blurry", icon: "⚠️", countKey: "blurry" },
];

export function ReceiptFilterBar({
  counts,
  active,
  onChange,
}: ReceiptFilterBarProps) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 pr-1">
      {FILTERS.map(({ id, label, icon, countKey }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              isActive
                ? "bg-yellow-500 text-black"
                : "border border-zinc-700 bg-zinc-800 text-zinc-300"
            }`}
          >
            {icon && <span className="mr-1">{icon}</span>}
            {label} ({counts[countKey]})
          </button>
        );
      })}
    </div>
  );
}
