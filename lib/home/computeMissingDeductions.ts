import type { Industry, Receipt } from "@/lib/types";
import { receiptsInTaxYear } from "@/lib/tax/taxYearStats";
import { clientTimeZone } from "@/lib/time/timeZone";
import {
  categoryMatchesHint,
  hintsForIndustry,
  type DeductionHint,
} from "@/lib/home/industryDeductionHints";

export interface MissingDeductionItem {
  hint: DeductionHint;
  label: string;
  taxEstimate: number;
}

export interface MissingDeductionsResult {
  missing: MissingDeductionItem[];
  previewLabels: string[];
  totalTaxEstimate: number;
}

export function computeMissingDeductions(
  receipts: Receipt[],
  industry: Industry | null,
  opts: {
    now?: Date;
    timeZone?: string;
    marginalRate?: number;
  } = {},
): MissingDeductionsResult {
  const now = opts.now ?? new Date();
  const timeZone = opts.timeZone ?? clientTimeZone();
  const marginalRate = opts.marginalRate ?? 0.25;
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now),
  );
  const yearReceipts = receiptsInTaxYear(receipts, year, timeZone);
  const hints = hintsForIndustry(industry);
  const missing: MissingDeductionItem[] = [];

  for (const hint of hints) {
    const tracked = yearReceipts.some((r) =>
      categoryMatchesHint(r.category, hint),
    );
    if (!tracked) {
      missing.push({
        hint,
        label: hint.label,
        taxEstimate: round2(hint.defaultEstimate * marginalRate),
      });
    }
  }

  const totalTaxEstimate = round2(
    missing.reduce((s, m) => s + m.taxEstimate, 0),
  );

  return {
    missing,
    previewLabels: missing.slice(0, 3).map((m) => m.label),
    totalTaxEstimate,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
