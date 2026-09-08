import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listPublishedIndustries } from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";

describe("buildIndustryJsonLd", () => {
  it("includes FAQPage and BreadcrumbList with real URLs for every published industry", () => {
    for (const page of listPublishedIndustries()) {
      const data = buildIndustryJsonLd(page);
      assert.equal(data["@context"], "https://schema.org");
      const graph = data["@graph"] as Array<Record<string, unknown>>;
      assert.ok(Array.isArray(graph));
      const faq = graph.find((n) => n["@type"] === "FAQPage");
      const crumbs = graph.find((n) => n["@type"] === "BreadcrumbList");
      assert.ok(faq, `${page.slug} must include FAQPage schema`);
      assert.ok(crumbs, `${page.slug} must include BreadcrumbList schema`);
      const entities = faq.mainEntity as unknown[];
      assert.equal(entities.length, page.faq.length);
      const items = crumbs.itemListElement as Array<Record<string, unknown>>;
      assert.equal(items.length, 3);
      assert.equal(new URL(String(items[1]?.item)).pathname, "/tax-deductions");
      assert.equal(new URL(String(items[2]?.item)).pathname, page.path);
      assert.equal(items[2]?.name, page.label);
    }
  });
});
