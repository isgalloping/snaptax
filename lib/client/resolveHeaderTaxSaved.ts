export type ResolveHeaderTaxSavedInput = {
  displayTaxSaved: number | null | undefined;
  seasonTotalTaxSaved: number | null | undefined;
  taxSavedFallback: number | null | undefined;
};

/** Shared Est. Tax Saved display value for TaxHeader + Settings TaxOverviewPanel. */
export function resolveHeaderTaxSaved(
  input: ResolveHeaderTaxSavedInput,
): number | null {
  if (input.displayTaxSaved != null) return input.displayTaxSaved;
  if (input.seasonTotalTaxSaved != null) return input.seasonTotalTaxSaved;
  return input.taxSavedFallback ?? null;
}
