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

function valueColorClass(active: boolean): string {
  return active
    ? settingsVisual.taxOverview.valuePositive
    : settingsVisual.taxOverview.valueNeutral;
}

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
          <p className={settingsVisual.taxOverview.label}>{copy.taxSaved}</p>
          <p
            className={`${settingsVisual.taxOverview.value} ${valueColorClass(taxSaved !== null && taxSaved > 0)}`}
          >
            {taxSaved === null ? EMPTY_AMOUNT : formatCurrency(taxSaved)}
          </p>
        </div>
        <div className="flex flex-col items-center px-2 text-center">
          <p className={settingsVisual.taxOverview.label}>{copy.receipts}</p>
          <p
            className={`${settingsVisual.taxOverview.value} ${valueColorClass(receiptCount > 0)}`}
          >
            {receiptCount}
          </p>
        </div>
        <div className="flex flex-col items-center px-2 text-center">
          <p className={settingsVisual.taxOverview.label}>{copy.deductions}</p>
          <p
            className={`${settingsVisual.taxOverview.value} ${valueColorClass(totalDeductions > 0)}`}
          >
            {formatCurrency(totalDeductions)}
          </p>
        </div>
      </div>
    </section>
  );
}
