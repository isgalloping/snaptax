/** Schedule C expense category → TXF TD transaction code (demo-aligned subset). */
const TXF_TD_BY_CATEGORY: Record<string, string> = {
  "TRUCK GAS": "2222",
  TOOLS: "2222",
  SUPPLIES: "2222",
  MATERIALS: "2222",
  EQUIPMENT: "2222",
  MEALS: "2222",
  OTHER: "2222",
};

const DEFAULT_TXF_TD = "2222";

export function txfTdForCategory(category: string | undefined): string {
  if (!category?.trim()) return DEFAULT_TXF_TD;
  const key = category.toUpperCase().trim();
  return TXF_TD_BY_CATEGORY[key] ?? DEFAULT_TXF_TD;
}

/** Demo uses TD 2213 for domain/advertising — map if category hints advertising. */
export function txfTdForMerchant(merchant: string, category: string): string {
  const m = merchant.toLowerCase();
  if (m.includes("domain") || m.includes("google")) return "2213";
  return txfTdForCategory(category);
}
