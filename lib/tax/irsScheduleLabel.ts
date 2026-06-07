const IRS_LABELS: Record<string, string> = {
  "TRUCK GAS": "Schedule C - Line 9 (Car & Truck Expenses)",
  TOOLS: "Schedule C - Line 22 (Supplies)",
  SUPPLIES: "Schedule C - Line 22 (Supplies)",
  EQUIPMENT: "Schedule C - Line 13 (Depreciation & Equipment)",
  MATERIALS: "Schedule C - Line 22 (Supplies)",
  MEALS: "Schedule C - Line 24b (Meals — 50% deductible)",
  OTHER: "Schedule C - Line 27a (Other expenses)",
  PERSONAL: "Not deductible — personal expense",
};

export function irsScheduleLabel(category: string | undefined): string {
  if (!category) return "Schedule C — business expense";
  const key = category.toUpperCase().trim();
  return IRS_LABELS[key] ?? IRS_LABELS.OTHER;
}
