import type { TaxRegion } from "@/lib/tax/types";

export type ReceiptStatus = "processing" | "done" | "blurry";

export type Industry =
  | "truck_driver"
  | "plumber"
  | "electrician"
  | "construction"
  | "delivery"
  | "general";

export interface Receipt {
  id: string;
  status: ReceiptStatus;
  amount?: number;
  merchant?: string;
  category?: string;
  taxAmount?: number;
  dataRegion?: TaxRegion;
  /** Event instant; persist/API as UTC ISO 8601 (`…Z`). */
  timestamp: Date;
  subtitle?: string;
  pendingUpload?: boolean;
}

export const INDUSTRIES: { id: Industry; label: string }[] = [
  { id: "truck_driver", label: "Truck Driver" },
  { id: "plumber", label: "Plumber" },
  { id: "electrician", label: "Electrician" },
  { id: "construction", label: "Construction" },
  { id: "delivery", label: "Delivery" },
  { id: "general", label: "General 1099" },
];
