/** US Schedule C categories (matches Vision prompt). */
export const US_EXPORT_CATEGORIES = [
  "TRUCK GAS",
  "TOOLS",
  "SUPPLIES",
  "EQUIPMENT",
  "MATERIALS",
  "MEALS",
  "PERSONAL",
  "OTHER",
] as const;

export type UsExportCategory = (typeof US_EXPORT_CATEGORIES)[number];

export function isUsExportCategory(value: string): value is UsExportCategory {
  return (US_EXPORT_CATEGORIES as readonly string[]).includes(
    value.toUpperCase().trim(),
  );
}
