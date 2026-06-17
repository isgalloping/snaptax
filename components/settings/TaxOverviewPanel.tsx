"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { formatCurrency } from "@/lib/format";
import { settingsVisual } from "@/lib/ui/settingsVisual";

export interface SettingsTaxStats {
  taxSaved: number | null;
  receiptCount: number;
  totalDeductions: number;
}

type TaxOverviewPanelProps = SettingsTaxStats;

const EMPTY_AMOUNT = "$—";

export function TaxOverviewPanel({
  taxSaved,
  receiptCount,
  totalDeductions,
}: TaxOverviewPanelProps) {
  const copy = useUserCopy().settings.taxOverview;

  return (
    <section className={`${settingsVisual.taxOverview.container} mb-4`}>
      <div className="grid grid-cols-3 divide-x divide-zinc-700 py-4">
        <div className="flex flex-col items-center px-2 text-center">
          <p className="text-[10px] font-bold uppercase text-zinc-400">{copy.taxSaved}</p>
          <p className={`mt-1 text-lg font-black ${settingsVisual.taxOverview.columnSaved}`}>
            {taxSaved === null ? EMPTY_AMOUNT : formatCurrency(taxSaved)}
          </p>
        </div>
        <div className="flex flex-col items-center px-2 text-center">
          <p className="text-[10px] font-bold uppercase text-zinc-400">
            {copy.receiptsTracked}
          </p>
          <p className={`mt-1 text-lg font-black ${settingsVisual.taxOverview.columnReceipts}`}>
            {receiptCount}
          </p>
        </div>
        <div className="flex flex-col items-center px-2 text-center">
          <p className="text-[10px] font-bold uppercase text-zinc-400">
            {copy.totalDeductions}
          </p>
          <p className={`mt-1 text-lg font-black ${settingsVisual.taxOverview.columnDeductions}`}>
            {formatCurrency(totalDeductions)}
          </p>
        </div>
      </div>
    </section>
  );
}
