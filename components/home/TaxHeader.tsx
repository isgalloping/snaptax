"use client";

import { formatCurrency } from "@/lib/format";
import { SettingsIcon } from "@/components/icons/SettingsIcon";

interface TaxHeaderProps {
  taxSaved: number | null;
  animating: boolean;
  onSettingsClick: () => void;
}

export function TaxHeader({
  taxSaved,
  animating,
  onSettingsClick,
}: TaxHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b-4 border-yellow-500 bg-zinc-900 p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Est. Tax Saved
        </p>
        <p
          className={`mt-1 text-4xl font-extrabold text-yellow-400 ${
            animating ? "animate-tax-bounce text-green-400" : ""
          }`}
        >
          {taxSaved === null ? "$- - -" : formatCurrency(taxSaved)}
        </p>
      </div>
      <button
        type="button"
        onClick={onSettingsClick}
        className="flex h-16 w-16 min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 transition-transform active:scale-95"
        aria-label="Settings"
      >
        <SettingsIcon className="h-7 w-7 text-white" />
      </button>
    </header>
  );
}
