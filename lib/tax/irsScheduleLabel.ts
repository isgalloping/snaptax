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

/** Short label for CSV export, e.g. `Line 9`, `Line 22`. */
export function irsScheduleLineShort(category: string | undefined): string {
  if (!category) return "Line 27a";
  const key = category.toUpperCase().trim();
  if (key === "PERSONAL") return "N/A";
  const label = IRS_LABELS[key] ?? IRS_LABELS.OTHER;
  const match = label.match(/Line (\d+[a-z]?)/i);
  return match ? `Line ${match[1]}` : "Line 27a";
}

/** TurboTax / CPA CSV label, e.g. `Line 22: Supplies`. */
export function irsCategoryExportLabel(category: string | undefined): string {
  if (!category) return "Line 27a: Other expenses";
  const key = category.toUpperCase().trim();
  if (key === "PERSONAL") return "N/A";
  const descriptions: Record<string, string> = {
    "TRUCK GAS": "Car & Truck Expenses",
    TOOLS: "Supplies",
    SUPPLIES: "Supplies",
    EQUIPMENT: "Depreciation & Equipment",
    MATERIALS: "Supplies",
    MEALS: "Deductible business meals",
    OTHER: "Other expenses",
  };
  const line = irsScheduleLineShort(category);
  const desc = descriptions[key] ?? descriptions.OTHER;
  return `${line}: ${desc}`;
}

/** Short badge for list cards, e.g. `Line 9`, `Line 22`, `N/A`. */
export function irsScheduleLineBadge(category: string | undefined): string {
  if (!category) return "Line 27a";
  const key = category.toUpperCase().trim();
  if (key === "PERSONAL") return "N/A";
  const label = IRS_LABELS[key] ?? IRS_LABELS.OTHER;
  const match = label.match(/Line (\d+[a-z]?)/i);
  return match ? `Line ${match[1]}` : "Line 27a";
}
