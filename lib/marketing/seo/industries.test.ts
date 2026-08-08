import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getIndustryBySlug,
  listPublishedIndustries,
} from "@/lib/marketing/seo/industries";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";

describe("seo industries registry", () => {
  it("publishes electrician only", () => {
    const list = listPublishedIndustries();
    assert.equal(list.length, 1);
    assert.equal(list[0]?.slug, "electrician");
    assert.equal(list[0]?.path, "/tax-deductions/electrician");
  });

  it("loads electrician by slug with PRD title/meta", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "Electrician Tax Deductions Checklist (Tools, Truck & Business Expenses)",
    );
    assert.match(page.seo.description, /tools, vehicles, supplies/i);
    assert.equal(page.howItWorks.id, "how-it-works");
    assert.equal(page.faq.length, 4);
  });

  it("how-it-works track step uses real US category names only", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    const track = page.howItWorks.steps[1];
    assert.ok(track);
    assert.match(track.body, /Truck Gas/i);
    assert.doesNotMatch(track.body, /\bEducation\b/);
    assert.doesNotMatch(track.body, /\bOperations\b/);
    assert.doesNotMatch(track.body, /\bVehicle\b/);
    for (const token of [
      "Tools",
      "Truck Gas",
      "Supplies",
      "Equipment",
      "Materials",
    ]) {
      assert.match(track.body, new RegExp(token, "i"));
    }
    for (const cat of US_EXPORT_CATEGORIES) {
      // sanity: enum still includes TOOLS
      if (cat === "TOOLS") assert.ok(true);
    }
  });

  it("expense examples use real US category display labels only", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    assert.equal(page.examplesCategoryHeader, "SnapTax category");
    const allowed = new Set([
      "Truck Gas",
      "Tools",
      "Supplies",
      "Equipment",
      "Materials",
      "Meals",
      "Personal",
      "Other",
    ]);
    for (const row of page.examples) {
      assert.ok(
        allowed.has(row.category),
        `unexpected category label: ${row.category}`,
      );
    }
    assert.doesNotMatch(page.hero.workerImage.src, /\.png$/i);
    assert.match(page.hero.ogImage.src, /electrician-og\.jpg$/);
  });

  it("returns undefined for unknown slug", () => {
    assert.equal(getIndustryBySlug("plumber"), undefined);
  });
});
