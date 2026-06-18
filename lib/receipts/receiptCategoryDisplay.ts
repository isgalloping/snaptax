import { formatCurrencyForRegion } from "@/lib/format";
import type { Receipt } from "@/lib/types";

const LABELS: Record<string, string> = {
  "TRUCK GAS": "Fuel",
  TOOLS: "Tools",
  SUPPLIES: "Supplies",
  MATERIALS: "Supplies",
  MEALS: "Meals",
  EQUIPMENT: "Equipment",
  PERSONAL: "Personal",
  OTHER: "Other",
};

export function receiptCategoryDisplayLabel(category?: string): string {
  if (!category) return "Other";
  return LABELS[category.toUpperCase().trim()] ?? "Other";
}

export function receiptTaxDisplay(receipt: Receipt): {
  label: string;
  variant: "deductible" | "muted";
} {
  const region = receipt.dataRegion ?? "us";
  const currency = receipt.currency ?? (region === "eu" ? "EUR" : "USD");
  const tax = receipt.taxAmount ?? 0;
  const deductible = receipt.deductible !== false && tax > 0;
  if (deductible) {
    return {
      label: `-${formatCurrencyForRegion(tax, currency, region)}`,
      variant: "deductible",
    };
  }
  return {
    label: formatCurrencyForRegion(0, currency, region),
    variant: "muted",
  };
}
