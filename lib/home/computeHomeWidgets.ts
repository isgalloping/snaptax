import type { Industry, Receipt } from "@/lib/types";
import { countByStatus } from "@/lib/receipts/receiptStats";
import { computeTaxDeadline, type TaxDeadlineInfo } from "./computeTaxDeadline";
import {
  computeMissingDeductions,
  type MissingDeductionsResult,
} from "./computeMissingDeductions";
import {
  computeTaxYearProgress,
  type TaxYearProgressResult,
} from "./computeTaxYearProgress";
import { shouldShowCpaReadyWidget } from "./shouldShowCpaReadyWidget";

export interface HomeWidgetsData {
  deadline: TaxDeadlineInfo;
  missing: MissingDeductionsResult;
  progress: TaxYearProgressResult;
  cpaReadyCount: number;
  showCpaReady: boolean;
}

export function computeHomeWidgets(
  receipts: Receipt[],
  taxSaved: number | null,
  industry: Industry | null,
  opts?: { now?: Date; timeZone?: string; marginalRate?: number },
): HomeWidgetsData {
  const now = opts?.now ?? new Date();
  const timeZone = opts?.timeZone;
  const counts = countByStatus(receipts);
  return {
    deadline: computeTaxDeadline(receipts, opts),
    missing: computeMissingDeductions(receipts, industry, opts),
    progress: computeTaxYearProgress(taxSaved, opts),
    cpaReadyCount: counts.done,
    showCpaReady: shouldShowCpaReadyWidget(now, timeZone),
  };
}
