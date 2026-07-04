import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadLegalMarkdown, parseLegalMarkdown } from "./markdownDoc";

describe("legal markdown docs", () => {
  it("loads pricing.md with expected sections", () => {
    const doc = parseLegalMarkdown(loadLegalMarkdown("pricing.md"));
    assert.equal(doc.title, "Snap1099 Pricing");
    assert.ok(doc.sections.some((s) => s.title === "What you pay for"));
    assert.ok(doc.sections.some((s) => s.title === "Related policies"));
  });

  it("loads refund.md with expected sections", () => {
    const doc = parseLegalMarkdown(loadLegalMarkdown("refund.md"));
    assert.equal(doc.title, "Snap1099 Refund Policy");
    assert.ok(doc.sections.some((s) => s.title === "How to request a refund"));
  });
});
