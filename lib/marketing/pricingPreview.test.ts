import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMarketingPricingCards } from "@/components/marketing/MarketingPricingCard";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { buildFounderRows } from "@/lib/legal/pricingPageData";
import type { FounderTierConfig } from "@/lib/server/founderConfig";

const mockTier = (
  priceUsd: number,
  seatRange: [number, number] | null,
): FounderTierConfig => ({
  priceUsd,
  priceCents: priceUsd * 100,
  paddlePriceId: "price_test",
  seatRange,
});

describe("buildFounderRows", () => {
  it("does not promise lifetime all-years access", () => {
    const rows = buildFounderRows({
      FOUNDER_LEVEL_SUPER: mockTier(5, [1, 10]),
      EARLY: mockTier(10, [11, 30]),
      FOUNDER: mockTier(15, [31, 50]),
      DEFAULT: mockTier(29, null),
    });
    for (const row of rows) {
      assert.doesNotMatch(row.note.toLowerCase(), /lifetime/);
      assert.doesNotMatch(row.note.toLowerCase(), /for life/);
    }
  });
});

describe("buildMarketingPricingCards", () => {
  it("renders full cards with per-tax-season copy", () => {
    const tiers = {
      FOUNDER_LEVEL_SUPER: mockTier(5, [1, 10]),
      EARLY: mockTier(10, [11, 30]),
      FOUNDER: mockTier(15, [31, 50]),
      DEFAULT: mockTier(29, null),
    };
    const cards = buildMarketingPricingCards({
      taxSeason: "2025",
      priceLabel: "$29.00",
      skuTier: "DEFAULT",
      showFounderTable: true,
      founderSeatsRemaining: 45,
      founderRows: buildFounderRows(tiers),
    });

    assert.equal(cards.length, 4);
    assert.equal(cards[0]?.label, "Founder #1-10");
    assert.equal(cards[0]?.availability, "Only 5 spots");
    assert.equal(cards[3]?.label, "Standard");
    assert.equal(cards[3]?.availability, "Always available");

    for (const bullet of MARKETING_COPY.pricing.cardBullets) {
      assert.doesNotMatch(bullet.toLowerCase(), /lifetime/);
    }
    assert.equal(
      MARKETING_COPY.pricing.seasonLabel,
      "One-time payment per tax season",
    );
  });
});
