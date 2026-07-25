export type LogLevel = "info" | "warn" | "error";

export type LogModule =
  | "api.auth"
  | "api.receipt"
  | "api.sync"
  | "api.user"
  | "api.entitlement"
  | "api.billing"
  | "api.webhook"
  | "biz.openai"
  | "biz.ocr"
  | "biz.blob"
  | "biz.ghost"
  | "biz.paddle"
  | "biz.founder"
  | "biz.export";

export type LogMeta = {
  receiptId?: string;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  taxSeason?: string;
  transactionId?: string;
  eventType?: string;
  intentId?: string | null;
  openaiModel?: string;
  tokenUsagePrompt?: number;
  tokenUsageCompletion?: number;
  ipHash?: string;
  dataRegion?: string;
  headerRegion?: string;
  reason?: string;
  previousGhostId?: string;
  mergedGhostIds?: string[];
  existingTransactionId?: string;
  entitlementCreated?: boolean;
  pathnameCount?: number;
  receiptCount?: number;
  entitlementCount?: number;
  checkoutIntentCount?: number;
  stage?: string;
  extractionSource?: string;
  engine?: string;
  event?: string;
  founderNumber?: number | null;
  tier?: string;
  skuTier?: string;
  internalTestCheckout?: boolean;
  founderPurchase?: boolean;
};

export type LogEntry = {
  ts: string;
  level: LogLevel;
  module: LogModule;
  success: boolean;
  durationMs: number;
  requestId?: string;
  method?: string | null;
  route?: string | null;
  httpStatus?: number | null;
  userId?: string | null;
  ghostId?: string | null;
  email?: string | null;
  authChannel?: string | null;
  meta?: LogMeta;
};
