import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { listPublishedIndustries } from "@/lib/marketing/seo/industries";

describe("marketing footer", () => {
  it("matches mockup column titles and key links", () => {
    const columns = MARKETING_COPY.footer.columns;

    assert.deepEqual(
      columns.map((column) => column.title),
      ["Product", "Company", "Legal", "Support"],
    );

    const company = columns.find((column) => column.title === "Company");
    assert.deepEqual(
      company?.links.map((link) => link.label),
      ["About", "Contact"],
    );

    const legal = columns.find((column) => column.title === "Legal");
    assert.deepEqual(
      legal?.links.map((link) => link.label),
      [
        "Privacy Policy",
        "Terms of Service",
        "Refund Policy",
        "Do Not Sell or Share",
        "Cookie Policy",
        "Disclaimer",
      ],
    );

    const support = columns.find((column) => column.title === "Support");
    assert.deepEqual(
      support?.links.map((link) => link.label),
      ["Help Center", "Contact Us"],
    );
  });

  it("uses LightXForge copyright holder", () => {
    assert.equal(MARKETING_COPY.footer.copyrightHolder, "LightXForge");
  });

  it("lists four social channels", () => {
    assert.deepEqual(
      MARKETING_COPY.footer.social.map((item) => item.id),
      ["facebook", "x", "instagram", "email"],
    );
  });

  it("links every published tax-deduction industry from the Product column", () => {
    const product = MARKETING_COPY.footer.columns.find(
      (column) => column.title === "Product",
    );
    assert.ok(product);

    const productIndustryLinks = product.links
      .filter((link) => link.href.startsWith("/tax-deductions/"))
      .map((link) => ({ href: link.href, label: link.label }));

    assert.deepEqual(
      productIndustryLinks,
      listPublishedIndustries().map((industry) => ({
        href: industry.path,
        label: `${industry.label} Tax Deductions`,
      })),
    );
  });
});
