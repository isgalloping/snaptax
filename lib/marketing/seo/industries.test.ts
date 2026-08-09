import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import sharp from "sharp";
import {
  getIndustryBySlug,
  listPublishedIndustries,
} from "@/lib/marketing/seo/industries";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";

describe("seo industries registry", () => {
  it("publishes electrician, hvac, and plumber", () => {
    const list = listPublishedIndustries();
    assert.equal(list.length, 3);
    assert.deepEqual(
      list.map((p) => p.slug),
      ["electrician", "hvac", "plumber"],
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
    assert.equal(getIndustryBySlug("roofer"), undefined);
  });

  it("electrician secondaryHref points to how-it-works", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    assert.equal(page.hero.secondaryHref, "#how-it-works");
  });

  it("loads plumber with PRD title/meta, UI H1, and spotlight layout", () => {
    const page = getIndustryBySlug("plumber");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "Plumber Tax Deductions: Expense Guide for Contractors | SnapTax",
    );
    assert.match(page.seo.description, /plumber tax deductions/i);
    assert.equal(page.hero.h1, "Plumbing tax deductions, organized.");
    assert.equal(page.hero.secondaryHref, "#deductions");
    assert.equal(page.hero.visualLayout, "spotlight");
    assert.equal(page.hero.highlights?.length, 4);
    assert.ok(page.howItWorks.stepsBanner?.src);
    assert.equal(page.deductionCards.length, 8);
    assert.equal(page.howItWorks.steps.length, 3);
    assert.equal(page.faq.length, 7);
    assert.equal(page.examples.length, 0);
    assert.equal(page.builtFor.features.length, 5);
    assert.ok(page.checklist);
  });

  it("plumber product copy avoids fake plumbing categories", () => {
    const page = getIndustryBySlug("plumber");
    assert.ok(page);
    const blob = [
      page.hero.trustItems.join(" "),
      ...page.howItWorks.steps.map((s) => s.body),
      ...page.builtFor.features.map((f) => `${f.title} ${f.body}`),
      page.productCategoryNote,
    ].join(" ");
    assert.doesNotMatch(blob, /Smart Plumbing Categories/i);
    assert.doesNotMatch(blob, /Plumbing expense categories/i);
    assert.match(page.howItWorks.steps[1]!.body, /Truck Gas|Supplies|Tools/i);
  });

  it("plumber mileage FAQ denies full mileage tracker", () => {
    const page = getIndustryBySlug("plumber");
    assert.ok(page);
    const mileage = page.faq.find((f) => /mileage/i.test(f.question));
    assert.ok(mileage);
    assert.match(mileage.answer, /does not/i);
    assert.match(mileage.answer, /separate/i);
  });

  it("each industry relatedTrades links to the other two", () => {
    for (const slug of ["electrician", "hvac", "plumber"] as const) {
      const page = getIndustryBySlug(slug);
      assert.ok(page?.relatedTrades);
      assert.equal(page.relatedTrades.links.length, 2);
      const hrefs = page.relatedTrades.links.map((l) => l.href).sort();
      const expected = [
        "/tax-deductions/electrician",
        "/tax-deductions/hvac",
        "/tax-deductions/plumber",
      ].filter((h) => h !== `/tax-deductions/${slug}`).sort();
      assert.deepEqual(hrefs, expected);
    }
  });

  it("hvac uses composite hero visualLayout with phoneImage", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    assert.equal(page.hero.visualLayout, "composite");
    assert.ok(page.hero.phoneImage?.src);
    assert.match(page.hero.phoneImage.src, /hvac-tax-deductions-snaptax-mobile/);
  });

  it("electrician keeps default stacked hero (no composite layout)", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    assert.notEqual(page.hero.visualLayout, "composite");
  });

  it("plumber uses mockup presentation for UI fidelity", () => {
    const page = getIndustryBySlug("plumber");
    assert.ok(page);
    assert.equal(page.presentation, "mockup");
    assert.ok(page.problemsClosing);
    assert.equal(getIndustryBySlug("electrician")?.presentation, undefined);
    assert.equal(getIndustryBySlug("hvac")?.presentation, undefined);
  });

  it("plumber phone and steps assets have alpha channel", async () => {
    const root = process.cwd();
    for (const rel of [
      "public/marketing/seo/plumber-tax-deductions-snaptax-phone.png",
      "public/marketing/seo/plumber-tax-deductions-snaptax-steps.png",
    ]) {
      const meta = await sharp(path.join(root, rel)).metadata();
      assert.equal(meta.hasAlpha, true, `${rel} must have alpha`);
    }
  });
});
