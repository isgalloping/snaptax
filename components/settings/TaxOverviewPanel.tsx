"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { formatCurrency } from "@/lib/format";
import { settingsVisual } from "@/lib/ui/settingsVisual";

export interface SettingsTaxStats {
  taxSaved: number | null;
  receiptCount: number;
  totalDeductions: number;
  incomeFormCount: number;
  totalIncomeGross: number;
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
  incomeFormCount,
  totalIncomeGross,
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
      {incomeFormCount > 0 && (
        <div className="border-t border-zinc-700 px-4 py-3 text-center">
          <p className={settingsVisual.taxOverview.label}>{copy.income}</p>
          <p className="mt-1 text-lg font-black text-yellow-400">
            {formatCurrency(totalIncomeGross)}
          </p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            {copy.incomeForms.replace("{count}", String(incomeFormCount))}
          </p>
        </div>
      )}
    </section>
  );
}
