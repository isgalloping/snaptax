import {
  getBlobReadWriteToken,
  getBlobStoreId,
  getBlobWebhookPublicKey,
  getVercelOidcToken,
} from "@/lib/server/env";

export type BlobCommandOptions = {
  token?: string;
  oidcToken?: string;
  storeId?: string;
};

/**
 * Resolves Blob SDK auth: `BLOB_READ_WRITE_TOKEN` or `VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID`.
 * @vercel/blob reads env automatically when options are omitted; we pass explicit options
 * so callers never force a missing read-write token.
 */
export function blobCommandOptions(): BlobCommandOptions {
  const rwToken = getBlobReadWriteToken();
  if (rwToken) return { token: rwToken };

  const storeId = getBlobStoreId();
  const oidcToken = getVercelOidcToken();
  if (storeId && oidcToken) {
    return { storeId, oidcToken };
  }

  throw new Error("BLOB_CREDENTIALS_MISSING");
}

/** PEM with literal `\n` from env normalized for Ed25519 webhook verification. */
export function blobWebhookPublicKeyPem(): string {
  const raw = getBlobWebhookPublicKey();
  if (!raw) throw new Error("BLOB_WEBHOOK_PUBLIC_KEY missing");
  return raw.replace(/\\n/g, "\n");
}

/** @deprecated Prefer blobCommandOptions(); kept for legacy call sites. */
export function blobToken(): string {
  const opts = blobCommandOptions();
  if (opts.token) return opts.token;
  throw new Error("BLOB_READ_WRITE_TOKEN missing");
}
