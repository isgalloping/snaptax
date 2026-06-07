"use client";

import { formatCurrency } from "@/lib/format";
import { SettingsIcon } from "@/components/icons/SettingsIcon";

interface TaxHeaderProps {
  taxSaved: number | null;
  totalExpenses: number;
  receiptCount: number;
  animating: boolean;
  onSettingsClick: () => void;
}

export function TaxHeader({
  taxSaved,
  totalExpenses,
  receiptCount,
  animating,
  onSettingsClick,
}: TaxHeaderProps) {
  return (
    <header className="border-b-4 border-yellow-500 bg-zinc-900 px-6 pb-6 pt-4">
      <div className="mb-4">
        <button
          type="button"
          onClick={onSettingsClick}
          className="flex h-14 w-14 min-h-14 min-w-14 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 transition-transform active:scale-95"
          aria-label="Settings"
        >
          <SettingsIcon className="h-6 w-6 text-white" />
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Estimated Tax Saved
        </p>
        <p
          className={`mt-2 text-5xl font-extrabold tracking-tight text-yellow-400 ${
            animating ? "animate-tax-bounce text-green-400" : ""
          }`}
        >
          {taxSaved === null ? "$- - -" : formatCurrency(taxSaved)}
        </p>
        <p className="mt-3 text-sm font-bold text-zinc-400">
          Tracking {formatCurrency(totalExpenses)} across {receiptCount}{" "}
          expense receipt{receiptCount === 1 ? "" : "s"}
        </p>
      </div>
    </header>
  );
}
