"use client";

import { apiFetch, ensureGhostSession, getClientOrphanGhostIds } from "@/lib/client/ghostClient";
import { GoogleAuthError } from "@/lib/client/googleAuthErrors";
import { clientTimeZone } from "@/lib/time/timeZone";
import { requestGoogleCredential } from "@/lib/client/googleAuth";
import {
  type GoogleUser,
  saveGoogleUser,
  setSeasonPaid,
} from "@/lib/client/authStorage";
import { fetchReceiptList } from "@/lib/client/receiptApi";
import {
  exportTaxPackFilename,
  type ExportFormat,
} from "@/lib/export/exportFilenames";

export type AuthMeResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    industry?: string | null;
    dataRegion?: string;
  } | null;
  ghostId: string | null;
};

export type GoogleAuthResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    dataRegion?: string;
    industry?: string | null;
  };
  bound: boolean;
  taxRecalcQueued: number;
};

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw new Error("AUTH_ME_FAILED");
  return (await res.json()) as AuthMeResponse;
}

async function parseGoogleAuthError(res: Response): Promise<GoogleAuthError> {
  try {
    const body = (await res.json()) as {
      error?: { code?: string; message?: string };
    };
    const code = body.error?.code ?? "GOOGLE_AUTH_FAILED";
    return new GoogleAuthError(code);
  } catch {
    return new GoogleAuthError("GOOGLE_AUTH_FAILED");
  }
}

export async function signInWithGoogleCredential(
  credential: string,
  options?: { ghostRetried?: boolean },
): Promise<GoogleAuthResponse> {
  const currentGhostId = await ensureGhostSession();
  const orphanGhostIds = getClientOrphanGhostIds(currentGhostId);
  const payload: { credential: string; orphanGhostIds?: string[] } = {
    credential,
  };
  if (orphanGhostIds.length > 0) {
    payload.orphanGhostIds = orphanGhostIds;
  }

  const res = await apiFetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 401 && !options?.ghostRetried) {
    await ensureGhostSession();
    return signInWithGoogleCredential(credential, { ghostRetried: true });
  }

  if (!res.ok) {
    throw await parseGoogleAuthError(res);
  }

  const data = (await res.json()) as GoogleAuthResponse;
  saveGoogleUser({
    email: data.user.email,
    name: data.user.name ?? data.user.email.split("@")[0] ?? "User",
  });
  return data;
}

export async function signInWithGoogleApi(): Promise<GoogleAuthResponse> {
  const credential = await requestGoogleCredential();
  return signInWithGoogleCredential(credential);
}

export async function signOutApi(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
  saveGoogleUser(null);
}

export async function fetchSeasonPaid(season: string): Promise<boolean> {
  const res = await apiFetch(`/api/entitlements/current?season=${season}`);
  if (!res.ok) return false;
  const data = (await res.json()) as { paid: boolean };
  return data.paid;
}

export async function pollTaxRecalc(
  taxRecalcQueued: number,
  onTick?: () => void,
): Promise<void> {
  if (taxRecalcQueued <= 0) return;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    await fetchReceiptList();
    onTick?.();
  }
}

export type { ExportFormat } from "@/lib/export/exportFilenames";

export type ExportTaxPackParams = {
  taxYear: string;
  format?: ExportFormat;
};

const EXPORT_TIMEOUT_MS = 90_000;

export type ExportTaxPackMeta = {
  receiptCount: number;
  imagesIncluded?: number;
  imagesEligible?: number;
  imagesMissing?: number;
};

export type ExportTaxPackResult = {
  file: File;
  meta: ExportTaxPackMeta;
};

function parseExportMeta(res: Response): ExportTaxPackMeta {
  const receiptCount = Number(res.headers.get("X-Export-Receipt-Count") ?? "0");
  const imagesIncluded = res.headers.get("X-Export-Images-Included");
  const imagesEligible = res.headers.get("X-Export-Images-Eligible");
  const imagesMissing = res.headers.get("X-Export-Images-Missing");
  const meta: ExportTaxPackMeta = { receiptCount };
  if (imagesIncluded != null) {
    meta.imagesIncluded = Number(imagesIncluded);
    meta.imagesEligible = Number(imagesEligible ?? "0");
    meta.imagesMissing = Number(imagesMissing ?? "0");
  }
  return meta;
}

function parseExportFilename(
  disposition: string | null,
  taxYear: string,
  format: ExportFormat,
): string {
  if (disposition) {
    const match = disposition.match(/filename="([^"]+)"/i);
    if (match?.[1]) return match[1];
  }
  return exportTaxPackFilename(format, taxYear);
}

export async function exportTaxPack(
  params: ExportTaxPackParams,
): Promise<ExportTaxPackResult> {
  const format = params.format ?? "csv";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);

  try {
    const res = await apiFetch("/api/export/tax-pack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Time-Zone": clientTimeZone(),
      },
      body: JSON.stringify({ taxYear: params.taxYear, format }),
      signal: controller.signal,
    });
    if (res.status === 402) throw new Error("PAYMENT_REQUIRED");
    if (res.status === 422) throw new Error("NO_RECEIPTS");
    if (!res.ok) {
      const errBody = (await res.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;
      if (errBody?.error?.code === "PDF_GENERATION_FAILED") {
        throw new Error("PDF_GENERATION_FAILED");
      }
      throw new Error("EXPORT_FAILED");
    }
    const blob = await res.blob();
    const filename = parseExportFilename(
      res.headers.get("Content-Disposition"),
      params.taxYear,
      format,
    );
    return {
      file: new File([blob], filename, { type: blob.type }),
      meta: parseExportMeta(res),
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("EXPORT_TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function pollEntitlementReady(
  season: string,
  maxMs = 15000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const paid = await fetchSeasonPaid(season);
    if (paid) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export async function deleteAccountApi(
  useUserApi: boolean,
  orphanGhostIds: string[] = [],
): Promise<void> {
  const path = useUserApi ? "/api/users/me" : "/api/ghost/data";
  const res = await apiFetch(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orphanGhostIds }),
  });
  if (res.status === 409) {
    let code = "";
    try {
      const body = (await res.json()) as { error?: { code?: string } };
      code = body.error?.code ?? "";
    } catch {
      /* ignore */
    }
    if (code === "GOOGLE_LOGIN_REQUIRED") {
      throw new Error("GOOGLE_LOGIN_REQUIRED");
    }
  }
  if (!res.ok && res.status !== 204) throw new Error("DELETE_ACCOUNT_FAILED");
  if (useUserApi) saveGoogleUser(null);
}

export function markSeasonPaidLocal(season: string): void {
  setSeasonPaid(season, true);
}

export type { GoogleUser };
