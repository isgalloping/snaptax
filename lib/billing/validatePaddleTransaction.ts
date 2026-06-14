export type PaddleWebhookPayload = {
  event_type?: string;
  data?: {
    id?: string;
    status?: string;
    custom_data?: {
      intentId?: string;
      userId?: string;
      taxSeason?: string;
    };
    details?: {
      totals?: {
        total?: string;
        currency_code?: string;
      };
    };
    currency_code?: string;
  };
};

export type PaddleTransactionValidation =
  | {
      ok: true;
      transactionId: string;
      amountUsd: number;
      totalCents: number;
      customData: PaddleWebhookPayload["data"] extends infer D
        ? D extends { custom_data?: infer C }
          ? C
          : undefined
        : undefined;
    }
  | { ok: false; reason: string };

function envMinAmountCents(): number {
  const raw = process.env.PADDLE_MIN_AMOUNT_CENTS;
  if (raw == null || raw.trim() === "") return 4900;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4900;
}

function envCurrency(): string {
  return (process.env.PADDLE_CURRENCY ?? "USD").trim().toUpperCase();
}

export function parsePaddleTotalCents(
  totals: { total?: string } | undefined,
): number | null {
  const raw = totals?.total;
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function validatePaddleTransaction(
  payload: PaddleWebhookPayload,
): PaddleTransactionValidation {
  if (payload.event_type !== "transaction.completed") {
    return { ok: false, reason: "unsupported_event_type" };
  }

  const data = payload.data;
  if (!data) {
    return { ok: false, reason: "missing_data" };
  }

  if (data.status !== "completed") {
    return { ok: false, reason: "invalid_status" };
  }

  const transactionId = data.id;
  if (!transactionId) {
    return { ok: false, reason: "missing_transaction_id" };
  }

  const totalCents = parsePaddleTotalCents(data.details?.totals);
  if (totalCents == null) {
    return { ok: false, reason: "missing_total" };
  }

  const minCents = envMinAmountCents();
  if (totalCents < minCents) {
    return { ok: false, reason: "amount_too_low" };
  }

  const currency =
    data.details?.totals?.currency_code?.trim().toUpperCase() ??
    data.currency_code?.trim().toUpperCase() ??
    envCurrency();

  if (currency !== envCurrency()) {
    return { ok: false, reason: "invalid_currency" };
  }

  return {
    ok: true,
    transactionId,
    totalCents,
    amountUsd: totalCents / 100,
    customData: data.custom_data,
  };
}
