import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TAX_DEDUCTION_SITEMAP_ENTRIES } from "@/lib/marketing/seo/sitemapEntries";

describe("TAX_DEDUCTION_SITEMAP_ENTRIES", () => {
  it("lists index and electrician with expected priorities", () => {
    assert.deepEqual(
      [...TAX_DEDUCTION_SITEMAP_ENTRIES],
      [
        { path: "/tax-deductions", priority: 0.6 },
        { path: "/tax-deductions/electrician", priority: 0.7 },
      ],
    );
  });
});
