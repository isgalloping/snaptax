import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IndustryBreadcrumb } from "@/components/marketing/seo/IndustryBreadcrumb";
import { IndustryFaq } from "@/components/marketing/seo/IndustryFaq";

describe("Industry SEO components", () => {
  it("keeps every FAQ answer in the rendered HTML for rich-result crawlers", () => {
    const markup = renderToStaticMarkup(
      createElement(IndustryFaq, {
        items: [
          {
            question: "Can electricians deduct tools?",
            answer: "Hand tools, meters, and replacement blades stay deductible.",
          },
          {
            question: "Do I need every receipt?",
            answer: "Keep receipts so the deduction trail survives tax review.",
          },
          {
            question: "Can I deduct mileage?",
            answer: "Job-site mileage belongs in the same tax-year record.",
          },
        ],
      }),
    );

    assert.match(markup, /Hand tools, meters, and replacement blades/);
    assert.match(markup, /Keep receipts so the deduction trail survives/);
    assert.match(markup, /Job-site mileage belongs in the same tax-year record/);
    assert.equal(markup.match(/aria-expanded="false"/g)?.length, 2);
  });

  it("renders the current breadcrumb item as a link with aria-current", () => {
    const markup = renderToStaticMarkup(
      createElement(IndustryBreadcrumb, {
        industryLabel: "Electrician",
        industryHref: "/tax-deductions/electrician",
      }),
    );

    assert.match(markup, /href="\/tax-deductions\/electrician"/);
    assert.match(markup, /aria-current="page"/);
    assert.match(markup, />Electrician<\/a>/);
  });
});
