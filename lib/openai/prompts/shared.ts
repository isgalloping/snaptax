import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";

/** Shared with Vision + text-classify prompts — keep in sync with `usExportCategories.ts`. */
export const US_CATEGORY_ENUM = US_EXPORT_CATEGORIES.join(", ");

export const MERCHANT_SINGLE_NAME_RULE =
  "merchant must be ONE store or vendor name — never combine multiple names with \"/\" or \"|\".";

export const US_MEALS_DEDUCTION_RULE =
  "MEALS business meals: deduction_ratio 0.5 when deductible; other deductible business categories: 1.0; PERSONAL: deduction_ratio 0.";

export const MULTI_RECEIPT_VISION_RULE =
  "If the image contains multiple separate receipts, set confidence below 0.5 and amount to 0.";

export const MULTI_RECEIPT_CLASSIFY_RULE =
  "If raw_text appears to contain multiple unrelated receipts, set confidence below 0.5 and amount to 0.";
