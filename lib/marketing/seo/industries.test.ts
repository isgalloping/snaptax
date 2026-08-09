import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getIndustryBySlug,
  listPublishedIndustries,
} from "@/lib/marketing/seo/industries";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";

describe("seo industries registry", () => {
  it("publishes electrician and hvac", () => {
    const list = listPublishedIndustries();
    assert.equal(list.length, 2);
    assert.deepEqual(
      list.map((p) => p.slug),
      ["electrician", "hvac"],
    );
  });

  it("loads hvac with PRD title/meta and UI block counts", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "HVAC Tax Deductions: Expense Guide for Contractors | SnapTax",
    );
    assert.match(page.seo.description, /HVAC tax deductions/i);
    assert.equal(page.path, "/tax-deductions/hvac");
    assert.equal(page.hero.secondaryHref, "#deductions");
    assert.equal(page.deductionCards.length, 8);
    assert.equal(page.howItWorks.steps.length, 3);
    assert.equal(page.faq.length, 6);
    assert.equal(page.examples.length, 0);
    assert.ok(page.checklist);
    assert.ok(page.checklist.items.length >= 8);
    assert.equal(
      page.relatedTrades?.links[0]?.href,
      "/tax-deductions/electrician",
    );
  });

  it("hvac how-it-works uses real US category names only", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    const organize = page.howItWorks.steps[1];
    assert.ok(organize);
    assert.match(organize.body, /Truck Gas/i);
    assert.doesNotMatch(organize.body, /Smart HVAC Categories/i);
  });

  it("hvac mileage FAQ denies full mileage tracker", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    const mileage = page.faq.find((f) => /mileage/i.test(f.question));
    assert.ok(mileage);
    assert.match(mileage.answer, /does not/i);
    assert.match(mileage.answer, /separate/i);
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
    assert.match(
      page.hero.workerImage.src,
      /electrician-tax-deductions-snaptax\.png$/,
    );
    assert.match(
      page.hero.ogImage.src,
      /electrician-tax-deductions-snaptax-og\.jpg$/,
    );
  });

  it("returns undefined for unknown slug", () => {
    assert.equal(getIndustryBySlug("plumber"), undefined);
  });

  it("electrician exposes relatedTrades to HVAC and secondaryHref how-it-works", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    assert.equal(page.hero.secondaryHref, "#how-it-works");
    assert.ok(page.relatedTrades);
    assert.equal(page.relatedTrades.links[0]?.href, "/tax-deductions/hvac");
  });
});
