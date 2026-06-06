/** Maps Vercel/Supabase `.env.local` names to canonical app env keys. */

function firstDefined(...values: (string | undefined)[]): string {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return "";
}

export function getDatabaseUrl(): string {
  return firstDefined(
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
  );
}

export function getGhostHmacSecret(): string {
  return firstDefined(
    process.env.GHOST_HMAC_SECRET,
    process.env.SUPABASE_JWT_SECRET,
    process.env.AUTH_SECRET,
  );
}

export function getAuthSecret(): string {
  return firstDefined(
    process.env.AUTH_SECRET,
    process.env.SUPABASE_JWT_SECRET,
    process.env.GHOST_HMAC_SECRET,
  );
}

export function getOpenAiApiKey(): string {
  return firstDefined(process.env.OPENAI_API_KEY, process.env.OPENAI_SECRET_KEY);
}

export function getOpenAiModel(): string {
  return firstDefined(
    process.env.OPENAI_MODEL,
    process.env.OPENAi_MODEL_NAME,
    "gpt-4o-mini",
  );
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
    process.env.PADDLE_SNAPTAX_PRICE_KEY,
  );
}

export function getPaddleWebhookSecret(): string {
  return firstDefined(process.env.PADDLE_WEBHOOK_SECRET);
}

export function applyEnvAliases(): void {
  if (!process.env.DATABASE_URL && getDatabaseUrl()) {
    process.env.DATABASE_URL = getDatabaseUrl();
  }
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
