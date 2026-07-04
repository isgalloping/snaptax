"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client/ghostClient";
import type { FounderTier } from "@/lib/founder/types";

export type ClientSeasonOffer = {
  priceUsd: number;
  priceCents: number;
  priceLabel: string;
  skuTier: FounderTier;
  taxSeason: string;
};

const DEFAULT_PRICE_USD = 29;

export function useSeasonOffer() {
  const [offer, setOffer] = useState<ClientSeasonOffer | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await apiFetch("/api/billing/season-offer");
        if (!res.ok) return;
        const data = (await res.json()) as ClientSeasonOffer;
        if (cancelled) return;
        if (typeof data.priceUsd === "number" && data.priceUsd > 0) {
          setOffer(data);
        } else if (typeof data.priceCents === "number" && data.priceCents > 0) {
          setOffer({ ...data, priceUsd: data.priceCents / 100 });
        }
      } catch {
        // Keep default display price
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    offer,
    priceUsd: offer?.priceUsd ?? DEFAULT_PRICE_USD,
    skuTier: offer?.skuTier ?? ("DEFAULT" as FounderTier),
  };
}
