"use client";

import { apiFetch } from "@/lib/client/ghostClient";
import { requestGoogleCredential } from "@/lib/client/googleAuth";
import {
  type GoogleUser,
  saveGoogleUser,
  setSeasonPaid,
} from "@/lib/client/authStorage";
import { fetchReceiptList } from "@/lib/client/receiptApi";

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

export async function signInWithGoogleApi(): Promise<GoogleAuthResponse> {
  const credential = await requestGoogleCredential();
  const res = await apiFetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) throw new Error("GOOGLE_AUTH_FAILED");
  const data = (await res.json()) as GoogleAuthResponse;
  saveGoogleUser({
    email: data.user.email,
    name: data.user.name ?? data.user.email.split("@")[0] ?? "User",
  });
  return data;
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

export async function exportTaxPack(season: string): Promise<File> {
  const res = await apiFetch("/api/export/tax-pack", { method: "POST" });
  if (res.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!res.ok) throw new Error("EXPORT_FAILED");
  const blob = await res.blob();
  return new File([blob], `Snap1099-${season}-Tax-Pack.xlsx`, { type: blob.type });
}

export async function deleteAccountApi(isSignedIn: boolean): Promise<void> {
  const path = isSignedIn ? "/api/users/me" : "/api/ghost/data";
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("DELETE_ACCOUNT_FAILED");
  if (isSignedIn) saveGoogleUser(null);
}

export function markSeasonPaidLocal(season: string): void {
  setSeasonPaid(season, true);
}

export type { GoogleUser };
