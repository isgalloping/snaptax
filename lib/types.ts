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
  /** Event instant; persist/API as UTC ISO 8601 (`…Z`). */
  timestamp: Date;
  subtitle?: string;
  pendingUpload?: boolean;
}

export const INDUSTRIES: { id: Industry; label: string }[] = [
  { id: "truck_driver", label: "卡车司机" },
  { id: "plumber", label: "水管工" },
  { id: "electrician", label: "电工" },
  { id: "construction", label: "建筑工" },
  { id: "delivery", label: "外卖骑手" },
  { id: "general", label: "通用自雇" },
];
