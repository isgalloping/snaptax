export type ScheduleCLineDef = {
  key: string;
  label: string;
  irsLabel: string;
  zipFolder: string;
};

export const SCHEDULE_C_PART_II_LINES: ScheduleCLineDef[] = [
  { key: "8", label: "Line 8", irsLabel: "Advertising", zipFolder: "Line_08_Advertising" },
  {
    key: "9",
    label: "Line 9",
    irsLabel: "Car and truck expenses",
    zipFolder: "Line_09_Car_and_truck_expenses",
  },
  {
    key: "10",
    label: "Line 10",
    irsLabel: "Commissions and fees",
    zipFolder: "Line_10_Commissions_and_fees",
  },
  {
    key: "11",
    label: "Line 11",
    irsLabel: "Contract labor",
    zipFolder: "Line_11_Contract_labor",
  },
  { key: "13", label: "Line 13", irsLabel: "Depreciation", zipFolder: "Line_13_Depreciation" },
  {
    key: "14",
    label: "Line 14",
    irsLabel: "Employee benefit programs",
    zipFolder: "Line_14_Employee_benefit_programs",
  },
  {
    key: "15",
    label: "Line 15",
    irsLabel: "Insurance (other than health)",
    zipFolder: "Line_15_Insurance",
  },
  { key: "16", label: "Line 16", irsLabel: "Interest", zipFolder: "Line_16_Interest" },
  {
    key: "17",
    label: "Line 17",
    irsLabel: "Legal and professional services",
    zipFolder: "Line_17_Legal_and_professional",
  },
  { key: "18", label: "Line 18", irsLabel: "Office expense", zipFolder: "Line_18_Office_expense" },
  { key: "20", label: "Line 20", irsLabel: "Rent or lease", zipFolder: "Line_20_Rent_or_lease" },
  {
    key: "21",
    label: "Line 21",
    irsLabel: "Repairs and maintenance",
    zipFolder: "Line_21_Repairs_and_maintenance",
  },
  { key: "22", label: "Line 22", irsLabel: "Supplies", zipFolder: "Line_22_Supplies" },
  {
    key: "23",
    label: "Line 23",
    irsLabel: "Taxes and licenses",
    zipFolder: "Line_23_Taxes_and_licenses",
  },
  { key: "24a", label: "Line 24a", irsLabel: "Travel", zipFolder: "Line_24a_Travel" },
  {
    key: "24b",
    label: "Line 24b",
    irsLabel: "Deductible meals",
    zipFolder: "Line_24b_Deductible_meals",
  },
  {
    key: "27a",
    label: "Line 27a",
    irsLabel: "Other expenses",
    zipFolder: "Line_27a_Other_expenses",
  },
];

const BY_LABEL = new Map(
  SCHEDULE_C_PART_II_LINES.map((line) => [line.label, line]),
);

export function scheduleCLineKeyFromLabel(scheduleCLine: string): string | null {
  return BY_LABEL.get(scheduleCLine)?.key ?? null;
}

/** IRS line key for audit CSV, e.g. `22`, `24b`. */
export function exportIrsLineKeyForRow(row: {
  scheduleCLine: string;
  irsLine: string;
}): string {
  return (
    scheduleCLineKeyFromLabel(row.scheduleCLine) ??
    scheduleCLineKeyFromLabel(row.irsLine) ??
    "27a"
  );
}

export function zipFolderForScheduleCLine(scheduleCLine: string): string {
  return BY_LABEL.get(scheduleCLine)?.zipFolder ?? "Line_27a_Other_expenses";
}

export function sumExportAmountsByLineKey(
  rows: { scheduleCLine: string; exportAmount: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = scheduleCLineKeyFromLabel(row.scheduleCLine) ?? "27a";
    totals.set(key, (totals.get(key) ?? 0) + row.exportAmount);
  }
  return totals;
}
