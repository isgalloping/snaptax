"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { MissingDeductionItem } from "@/lib/home/computeMissingDeductions";
import { formatCurrency } from "@/lib/format";
import { OverlayShell } from "./OverlayShell";

interface MissingDeductionItemOverlayProps {
  item: MissingDeductionItem;
  onBack: () => void;
  onStartTracking: () => void;
}

export function MissingDeductionItemOverlay({
  item,
  onBack,
  onStartTracking,
}: MissingDeductionItemOverlayProps) {
  const copy = useUserCopy().home.overlays;

  return (
    <OverlayShell
      title={item.label}
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={onStartTracking}
          className="flex min-h-16 w-full items-center justify-center rounded-xl bg-yellow-500 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
        >
          {copy.startTracking}
        </button>
      }
    >
      <div className="space-y-6">
        <p className="text-sm font-semibold text-green-400">
          {formatCurrency(item.taxEstimate)} est. tax savings
        </p>
        <p className="text-base leading-relaxed text-zinc-300">{item.hint.whyItMatters}</p>
      </div>
    </OverlayShell>
  );
}
