import { apiFetch } from "@/lib/client/ghostClient";
import type { FounderStatus, FounderTier } from "./types";

export type FounderProgramClientState = {
  enabled: boolean;
  seatsTotal: number;
  claimedCount: number;
  remaining: number;
  programOpen: boolean;
  tiers: Record<
    FounderTier,
    {
      priceUsd: number;
      priceCents: number;
      paddlePriceId: string;
      seatRange: [number, number] | null;
    }
  >;
  user: {
    founderStatus: FounderStatus;
    founderTier: FounderTier | null;
    founderNumber: number | null;
    currentSeasonEntitled: boolean;
  } | null;
};

export async function fetchFounderProgramClient(): Promise<FounderProgramClientState | null> {
  try {
    const res = await apiFetch("/api/founder/program");
    if (!res.ok) return null;
    return (await res.json()) as FounderProgramClientState;
  } catch {
    return null;
  }
}
