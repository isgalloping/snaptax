"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client/ghostClient";
import type { FounderTier } from "@/lib/founder/types";
import { formatCurrency } from "@/lib/format";

export type ClientSeasonOffer = {
  priceUsd: number;
  priceCents: number;
  priceLabel: string;
  skuTier: FounderTier;
  taxSeason: string;
  priceDisplay?: "internal_test";
};

const DEFAULT_PRICE_USD = 29;

function isValidSeasonOffer(data: ClientSeasonOffer): boolean {
  if (data.priceDisplay === "internal_test") {
    return typeof data.priceUsd === "number" && data.priceUsd > 0;
  }
  if (typeof data.priceUsd === "number" && data.priceUsd > 0) {
    return true;
  }
  return typeof data.priceCents === "number" && data.priceCents > 0;
}

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
        if (!isValidSeasonOffer(data)) return;

        if (
          typeof data.priceUsd !== "number" &&
          typeof data.priceCents === "number" &&
          data.priceCents > 0
        ) {
          setOffer({ ...data, priceUsd: data.priceCents / 100 });
          return;
        }

        setOffer(data);
      } catch {
        // Keep default display price
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isInternalTestPrice = offer?.priceDisplay === "internal_test";
  const priceLabel =
    offer?.priceLabel ?? formatCurrency(offer?.priceUsd ?? DEFAULT_PRICE_USD);

  return {
    offer,
    priceUsd: offer?.priceUsd ?? DEFAULT_PRICE_USD,
    priceLabel,
    isInternalTestPrice,
    skuTier: offer?.skuTier ?? ("DEFAULT" as FounderTier),
  };
}
