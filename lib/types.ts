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
  currency?: string;
  deductible?: boolean;
  /** Server has the image blob; local copy removed after upload. */
  hasRemoteImage?: boolean;
  /** @deprecated Prefer hasRemoteImage + signed URL API. */
  imageUrl?: string | null;
  /** Event instant; persist/API as UTC ISO 8601 (`…Z`). */
  timestamp: Date;
  /** Last mutation instant; sort/sync window key. Falls back to timestamp when omitted. */
  updatedAt?: Date;
  /** Tax season when receipt was filed via export; paired with taxSeasonDate. */
  taxSeason?: string;
  /** UTC instant when marked filed; both taxSeason and taxSeasonDate set = filed. */
  taxSeasonDate?: Date;
  subtitle?: string;
  pendingUpload?: boolean;
  /** Local photo blob unavailable; user must resnap. */
  photoMissing?: boolean;
  isOnboardingDemo?: boolean;
}

export const INDUSTRIES: { id: Industry; label: string }[] = [
  { id: "truck_driver", label: "Truck Driver" },
  { id: "plumber", label: "Plumber" },
  { id: "electrician", label: "Electrician" },
  { id: "construction", label: "Construction" },
  { id: "delivery", label: "Delivery" },
  { id: "general", label: "General 1099" },
];
