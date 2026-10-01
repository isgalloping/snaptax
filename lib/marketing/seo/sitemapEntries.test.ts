import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listPublishedIndustries } from "@/lib/marketing/seo/industries";
import { TAX_DEDUCTION_SITEMAP_ENTRIES } from "@/lib/marketing/seo/sitemapEntries";

describe("TAX_DEDUCTION_SITEMAP_ENTRIES", () => {
  it("lists index and published industries with expected priorities", () => {
    assert.deepEqual(
      [...TAX_DEDUCTION_SITEMAP_ENTRIES],
      [
        { path: "/tax-deductions", priority: 0.6 },
        { path: "/tax-deductions/electrician", priority: 0.7 },
        { path: "/tax-deductions/hvac", priority: 0.7 },
        { path: "/tax-deductions/plumber", priority: 0.7 },
        { path: "/tax-deductions/roofer", priority: 0.7 },
        { path: "/tax-deductions/landscaper", priority: 0.7 },
      ],
    );
  });

  it("keeps every published industry discoverable by sitemap", () => {
    const sitemapIndustryPaths = TAX_DEDUCTION_SITEMAP_ENTRIES.filter(
      (entry) => entry.path !== "/tax-deductions",
    ).map((entry) => entry.path);

    assert.deepEqual(
      sitemapIndustryPaths,
      listPublishedIndustries().map((industry) => industry.path),
    );
    for (const entry of TAX_DEDUCTION_SITEMAP_ENTRIES) {
      assert.equal(
        entry.priority,
        entry.path === "/tax-deductions" ? 0.6 : 0.7,
        `${entry.path} uses the expected SEO priority`,
      );
    }
  });
});
