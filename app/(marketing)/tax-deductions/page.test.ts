import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import TaxDeductionsIndexPage, { metadata } from "./page.tsx";
import { listPublishedIndustries } from "@/lib/marketing/seo/industries";

describe("/tax-deductions page", () => {
  it("publishes SEO metadata for the trade index route", () => {
    assert.deepEqual(metadata.title, {
      absolute: "Tax Deductions by Trade | SnapTax",
    });
    assert.match(
      String(metadata.description),
      /electricians, HVAC technicians, plumbers, roofers, and landscapers/,
    );
    assert.match(String(metadata.alternates?.canonical), /\/tax-deductions$/);
    assert.match(String(metadata.openGraph?.url), /\/tax-deductions$/);
  });

  it("renders every published industry card from the SEO registry", () => {
    const html = renderToStaticMarkup(TaxDeductionsIndexPage());

    assert.match(html, /Tax Deductions by Trade/);
    assert.match(html, /For educational purposes only\. Not tax advice\./);

    for (const industry of listPublishedIndustries()) {
      assert.match(html, new RegExp(`href="${escapeRegExp(industry.path)}"`));
      assert.match(html, new RegExp(`>${escapeRegExp(industry.label)}</h2>`));
      assert.match(html, new RegExp(escapeRegExp(industry.indexBlurb)));
    }
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
