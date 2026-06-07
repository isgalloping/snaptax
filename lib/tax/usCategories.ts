const CATEGORY_RATIOS: Record<string, number> = {
  "TRUCK GAS": 1,
  TOOLS: 1,
  SUPPLIES: 1,
  EQUIPMENT: 1,
  MATERIALS: 1,
  OTHER: 1,
  MEALS: 0.5,
  PERSONAL: 0,
};

export function resolveDeductionRatio(
  category: string,
  aiRatio: number,
): number {
  const normalized = category.toUpperCase().trim();
  const tableRatio = CATEGORY_RATIOS[normalized];
  if (tableRatio === 0) return 0;
  if (tableRatio != null) return Math.min(tableRatio, aiRatio);
  return Math.min(1, Math.max(0, aiRatio));
}

export function usMarginalRate(): number {
  return Number(process.env.TAX_US_MARGINAL_RATE ?? 0.25);
}
