import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { categoryExportMapping } from "@/lib/export/mapping/exportCategoryMapping";
import {
  buildReceiptAlias,
  buildReceiptArchivePath,
} from "@/lib/export/mapping/receiptNaming";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatBusinessPercent(
  amount: number,
  deductibleAmount: number,
  isPersonal: boolean,
): string {
  if (isPersonal || amount === 0) return "0%";
  const pct = Math.round((deductibleAmount / amount) * 100);
  return `${pct}%`;
}

function dedupeExportRows(rows: ExportExpenseRow[]): ExportExpenseRow[] {
  const seen = new Set<string>();
  const result: ExportExpenseRow[] = [];
  for (const row of rows) {
    const key = row.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function mealsNotes(existing: string): string {
  if (existing && !existing.includes("Unclassified")) return existing;
  return "Add business purpose for meals — review with CPA";
}

function enrichRow(
  row: ExportExpenseRow,
  aliasRegistry: Map<string, number>,
): ExportExpenseRow {
  const isZeroDeductible = row.deductibleAmount === 0 || !row.deductible;
  const mapping = isZeroDeductible
    ? categoryExportMapping("PERSONAL")
    : categoryExportMapping(row.category);

  const categoryDisplay = isZeroDeductible ? "Personal" : mapping.displayName;
  const scheduleCLine = isZeroDeductible ? "" : mapping.scheduleCLine;
  const taxDeductible = isZeroDeductible ? "No" : "Yes";
  const exportAmount = isZeroDeductible ? row.amount : row.deductibleAmount;
  const businessPercent = formatBusinessPercent(
    row.amount,
    row.deductibleAmount,
    isZeroDeductible,
  );

  const aliasKey = `${row.dateIso}|${sanitizeAliasKey(row.merchant)}|${row.amount.toFixed(2)}`;
  const aliasCount = aliasRegistry.get(aliasKey) ?? 0;
  aliasRegistry.set(aliasKey, aliasCount + 1);
  const suffix = aliasCount > 0 ? String(aliasCount + 1) : undefined;

  const receiptAlias = buildReceiptAlias({
    dateIso: row.dateIso,
    merchant: row.merchant,
    amount: row.amount,
    suffix,
  });
  const receiptArchivePath = buildReceiptArchivePath({
    category: isZeroDeductible ? "PERSONAL" : row.category,
    dateIso: row.dateIso,
    merchant: row.merchant,
    amount: row.amount,
    suffix,
  });

  let notes = row.notes;
  if (row.category === "MEALS" && row.deductible && row.deductibleAmount > 0) {
    notes = mealsNotes(notes);
  }

  return {
    ...row,
    categoryDisplay,
    scheduleCLine,
    taxDeductible,
    businessPercent,
    exportAmount: round2(exportAmount),
    notes,
    receiptAlias,
    receiptArchivePath,
    receiptImageUrl: receiptAlias,
  };
}

function sanitizeAliasKey(merchant: string): string {
  return merchant.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();
}

/** Apply biz export rules: mapping, Personal override, dedupe, REC aliases. */
export function finalizeExportRows(
  rows: ExportExpenseRow[],
): ExportExpenseRow[] {
  const deduped = dedupeExportRows(rows);
  const aliasRegistry = new Map<string, number>();
  return deduped.map((row) => enrichRow(row, aliasRegistry));
}
