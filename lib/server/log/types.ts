export type LogLevel = "info" | "warn" | "error";

export type LogModule =
  | "api.auth"
  | "api.receipt"
  | "api.user"
  | "api.entitlement"
  | "api.billing"
  | "api.webhook"
  | "biz.openai"
  | "biz.ocr"
  | "biz.blob"
  | "biz.ghost"
  | "biz.paddle"
  | "biz.export"
  | "biz.verify";

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
  existingTransactionId?: string;
  entitlementCreated?: boolean;
  pathnameCount?: number;
  receiptCount?: number;
  verifyBypass?: boolean;
  mockAi?: boolean;
  bypassPay?: boolean;
  stage?: string;
  extractionSource?: string;
  engine?: string;
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
