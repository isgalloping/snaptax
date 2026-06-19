export type CategoryExportMapping = {
  /** TurboTax `Category` column (human-readable). */
  displayName: string;
  /** e.g. `Line 22` */
  scheduleCLine: string;
  /** CPA ZIP folder under `02_Expenses_Receipts_Book/`. */
  zipFolderName: string;
};

const CATEGORY_EXPORT: Record<string, CategoryExportMapping> = {
  "TRUCK GAS": {
    displayName: "Car & Truck",
    scheduleCLine: "Line 9",
    zipFolderName: "Line_09_Car_and_Truck",
  },
  TOOLS: {
    displayName: "Supplies",
    scheduleCLine: "Line 22",
    zipFolderName: "Line_22_Supplies",
  },
  SUPPLIES: {
    displayName: "Supplies",
    scheduleCLine: "Line 22",
    zipFolderName: "Line_22_Supplies",
  },
  MATERIALS: {
    displayName: "Supplies",
    scheduleCLine: "Line 22",
    zipFolderName: "Line_22_Supplies",
  },
  EQUIPMENT: {
    displayName: "Equipment",
    scheduleCLine: "Line 13",
    zipFolderName: "Line_13_Depreciation_and_Equipment",
  },
  MEALS: {
    displayName: "Meals",
    scheduleCLine: "Line 24b",
    zipFolderName: "Line_24b_Meals",
  },
  OTHER: {
    displayName: "Other expenses",
    scheduleCLine: "Line 27a",
    zipFolderName: "Line_27a_Other_expenses",
  },
  PERSONAL: {
    displayName: "Personal",
    scheduleCLine: "",
    zipFolderName: "",
  },
};

const DEFAULT_MAPPING = CATEGORY_EXPORT.OTHER!;

export function categoryExportMapping(
  category: string | undefined,
): CategoryExportMapping {
  if (!category?.trim()) return DEFAULT_MAPPING;
  const key = category.toUpperCase().trim();
  return CATEGORY_EXPORT[key] ?? DEFAULT_MAPPING;
}
