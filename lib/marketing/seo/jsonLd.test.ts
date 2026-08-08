import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ELECTRICIAN_SEO_PAGE } from "@/lib/marketing/seo/industries/electrician";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";

describe("buildIndustryJsonLd", () => {
  it("includes FAQPage and BreadcrumbList with real URLs", () => {
    const data = buildIndustryJsonLd(ELECTRICIAN_SEO_PAGE);
    assert.equal(data["@context"], "https://schema.org");
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    assert.ok(Array.isArray(graph));
    const faq = graph.find((n) => n["@type"] === "FAQPage");
    const crumbs = graph.find((n) => n["@type"] === "BreadcrumbList");
    assert.ok(faq);
    assert.ok(crumbs);
    const entities = faq.mainEntity as unknown[];
    assert.equal(entities.length, 4);
    const items = crumbs.itemListElement as Array<Record<string, unknown>>;
    assert.equal(items.length, 3);
    assert.match(String(items[1]?.item), /\/tax-deductions$/);
    assert.match(String(items[2]?.item), /\/tax-deductions\/electrician$/);
  });
});
