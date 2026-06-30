export type ResolveHeaderTaxSavedInput = {
  displayTaxSaved: number | null | undefined;
  seasonUnfiledTaxSaved: number | null | undefined;
  taxSavedFallback: number | null | undefined;
};

/** Shared Est. Tax Saved display value for TaxHeader + Settings TaxOverviewPanel. */
export function resolveHeaderTaxSaved(
  input: ResolveHeaderTaxSavedInput,
): number | null {
  if (input.displayTaxSaved != null) return input.displayTaxSaved;
  if (input.seasonUnfiledTaxSaved != null) return input.seasonUnfiledTaxSaved;
  return input.taxSavedFallback ?? null;
}
