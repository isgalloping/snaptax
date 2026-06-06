export type LogLevel = "info" | "warn" | "error";

export type LogModule =
  | "api.auth"
  | "api.receipt"
  | "api.user"
  | "api.entitlement"
  | "api.webhook"
  | "biz.openai"
  | "biz.blob"
  | "biz.ghost"
  | "biz.paddle"
  | "biz.export";

export type LogMeta = {
  receiptId?: string;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  taxSeason?: string;
  transactionId?: string;
  openaiModel?: string;
  tokenUsagePrompt?: number;
  tokenUsageCompletion?: number;
  ipHash?: string;
  dataRegion?: string;
  reason?: string;
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
