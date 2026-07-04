/** Maps Vercel/Supabase `.env.local` names to canonical app env keys. */

function firstDefined(...values: (string | undefined)[]): string {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return "";
}

function isProdLikeDeployEnv(): boolean {
  const env = process.env.VERCEL_ENV;
  return env === "production" || env === "preview";
}

export function getDatabaseUrl(): string {
  // Local dev: prefer session pooler / direct (5432) over transaction pooler (6543).
  // See docs/tech/09-deployment-vercel.md §9.7 — :6543 often P1001 on local networks.
  return firstDefined(
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  );
}

export function getGhostHmacSecret(): string {
  if (isProdLikeDeployEnv()) {
    return firstDefined(process.env.GHOST_HMAC_SECRET);
  }
  return firstDefined(
    process.env.GHOST_HMAC_SECRET,
    process.env.SUPABASE_JWT_SECRET,
    process.env.AUTH_SECRET,
  );
}

export function getAuthSecret(): string {
  if (isProdLikeDeployEnv()) {
    return firstDefined(process.env.AUTH_SECRET);
  }
  return firstDefined(
    process.env.AUTH_SECRET,
    process.env.SUPABASE_JWT_SECRET,
    process.env.GHOST_HMAC_SECRET,
  );
}

export function getOpenAiApiKey(): string {
  return firstDefined(process.env.OPENAI_API_KEY, process.env.OPENAI_SECRET_KEY);
}

/** OpenAI-compatible gateway base URL (e.g. https://maxapi.pro/v1). Empty = official OpenAI. */
export function getOpenAiBaseUrl(): string | undefined {
  const raw = firstDefined(process.env.OPENAI_BASE_URL);
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "");
}

export function getOpenAiModel(): string {
  return firstDefined(
    process.env.OPENAI_MODEL,
    process.env.OPENAi_MODEL_NAME,
    "gpt-4o-mini",
  );
}

export function getOpenAiClassifyModel(): string {
  return firstDefined(process.env.OPENAI_CLASSIFY_MODEL, getOpenAiModel());
}

export function getOpenAiTimeoutMs(): number {
  const raw = firstDefined(process.env.OPENAI_TIMEOUT_MS);
  const parsed = raw ? Number(raw) : 120_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120_000;
}

export function getOpenAiMaxRetries(): number {
  const raw = firstDefined(process.env.OPENAI_MAX_RETRIES);
  const parsed = raw ? Number(raw) : 2;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2;
}

export function getBlobReadWriteToken(): string | undefined {
  const token = firstDefined(process.env.BLOB_READ_WRITE_TOKEN);
  return token || undefined;
}

export function getBlobStoreId(): string {
  return firstDefined(process.env.BLOB_STORE_ID);
}

export function getVercelOidcToken(): string {
  return firstDefined(process.env.VERCEL_OIDC_TOKEN);
}

export function getBlobWebhookPublicKey(): string {
  return firstDefined(process.env.BLOB_WEBHOOK_PUBLIC_KEY);
}

export function getGoogleClientId(): string {
  return firstDefined(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID,
  );
}

export function getGoogleClientSecret(): string {
  return firstDefined(process.env.GOOGLE_CLIENT_SECRET);
}

export function getPaddleClientToken(): string {
  return firstDefined(
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    process.env.PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN,
  );
}

export function getPaddleApiKey(): string {
  return firstDefined(
    process.env.PADDLE_API_KEY,
    process.env.PADDLE_SNAPTAX_API_KEY,
  );
}

export function getPaddlePriceId(): string {
  return firstDefined(
    process.env.PADDLE_PRICE_ID,
    process.env.FOUNDER_LEVEL_DEFAULT,
    process.env.PADDLE_SNAPTAX_PRICE_KEY,
  );
}

export function getPaddlePriceIdForFounderTier(tier: string): string {
  switch (tier) {
    case "FOUNDER_LEVEL_SUPER":
      return firstDefined(
        process.env.PADDLE_PRICE_ID_FOUNDER_SUPER,
        process.env.FOUNDER_LEVEL_SUPER,
      );
    case "EARLY":
      return firstDefined(
        process.env.PADDLE_PRICE_ID_FOUNDER_EARLY,
        process.env.FOUNDER_LEVEL_EARLY,
      );
    case "FOUNDER":
      return firstDefined(
        process.env.PADDLE_PRICE_ID_FOUNDER,
        process.env.FOUNDER_LEVEL_FOUNDER,
      );
    default:
      return getPaddlePriceId();
  }
}

export function getPaddleWebhookSecret(): string {
  return firstDefined(process.env.PADDLE_WEBHOOK_SECRET);
}

export function applyEnvAliases(): void {
  if (!process.env.DATABASE_URL && getDatabaseUrl()) {
    process.env.DATABASE_URL = getDatabaseUrl();
  }
  if (isProdLikeDeployEnv()) return;
  if (!process.env.GHOST_HMAC_SECRET && getGhostHmacSecret()) {
    process.env.GHOST_HMAC_SECRET = getGhostHmacSecret();
  }
  if (!process.env.AUTH_SECRET && getAuthSecret()) {
    process.env.AUTH_SECRET = getAuthSecret();
  }
  if (!process.env.OPENAI_API_KEY && getOpenAiApiKey()) {
    process.env.OPENAI_API_KEY = getOpenAiApiKey();
  }
  if (!process.env.OPENAI_MODEL && getOpenAiModel()) {
    process.env.OPENAI_MODEL = getOpenAiModel();
  }
}
