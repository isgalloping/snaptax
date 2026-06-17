"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { MissingDeductionsResult } from "@/lib/home/computeMissingDeductions";
import { formatCurrency } from "@/lib/format";
import { OverlayShell } from "./OverlayShell";

interface MissingDeductionsOverlayProps {
  data: MissingDeductionsResult;
  onBack: () => void;
  onSelectItem: (hintId: string) => void;
}

export function MissingDeductionsOverlay({
  data,
  onBack,
  onSelectItem,
}: MissingDeductionsOverlayProps) {
  const copy = useUserCopy().home.overlays;

  return (
    <OverlayShell title={copy.missingTitle} onBack={onBack}>
      <ul className="space-y-3">
        {data.missing.map((item) => (
          <li key={item.hint.id}>
            <button
              type="button"
              onClick={() => onSelectItem(item.hint.id)}
              className="flex w-full min-h-16 items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition-transform active:scale-95"
            >
              <span className="text-base font-bold text-white">{item.label}</span>
              <span className="shrink-0 text-sm font-semibold text-green-400">
                {formatCurrency(item.taxEstimate)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </OverlayShell>
  );
}
