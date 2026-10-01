import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getIndustryBySlug,
  listPublishedIndustries,
} from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";

describe("buildIndustryJsonLd", () => {
  it("includes FAQPage and BreadcrumbList with real URLs", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    const data = buildIndustryJsonLd(page);
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

  it("emits complete FAQ and breadcrumb graph for every published industry", () => {
    for (const page of listPublishedIndustries()) {
      const data = buildIndustryJsonLd(page);
      const graph = data["@graph"] as Array<Record<string, unknown>>;
      const faq = graph.find((n) => n["@type"] === "FAQPage");
      const crumbs = graph.find((n) => n["@type"] === "BreadcrumbList");

      assert.ok(faq, `${page.slug} includes FAQPage schema`);
      assert.ok(crumbs, `${page.slug} includes BreadcrumbList schema`);
      assert.deepEqual(
        (faq.mainEntity as Array<Record<string, unknown>>).map((entity) => ({
          name: entity.name,
          text: (entity.acceptedAnswer as Record<string, unknown>).text,
        })),
        page.faq.map((item) => ({
          name: item.question,
          text: item.answer,
        })),
      );

      const items = crumbs.itemListElement as Array<Record<string, unknown>>;
      assert.equal(items[2]?.name, page.label);
      assert.ok(
        String(items[2]?.item).endsWith(page.path),
        `${page.slug} breadcrumb points at its landing path`,
      );
    }
  });
});
