import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFounderTierConfigs } from "@/lib/server/founderConfig";
import { buildFounderRows } from "./pricingPageData";

const tiers = buildFounderTierConfigs({
  FOUNDER_LEVEL_SUPER: 5,
  EARLY: 10,
  FOUNDER: 15,
  DEFAULT: 29,
});

describe("buildFounderRows", () => {
  it("lists all tiers with seat ranges and prices", () => {
    const rows = buildFounderRows(tiers);
    assert.equal(rows.length, 4);
    assert.equal(rows[0]?.label, "Super Founder");
    assert.equal(rows[0]?.seatRange, "1–10");
    assert.equal(rows[0]?.priceLabel, "$5.00");
    assert.equal(rows[3]?.seatRange, "51+");
    assert.equal(rows[3]?.priceLabel, "$29.00");
  });
});
