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

  it("loads data-retention.md without internal repo paths", () => {
    const raw = loadLegalMarkdown("data-retention.md");
    assert.doesNotMatch(raw, /docs\//);
    assert.doesNotMatch(raw, /lib\//);
    assert.doesNotMatch(raw, /\.ts/);

    const doc = parseLegalMarkdown(raw);
    assert.equal(doc.title, "Snap1099 Data Retention Policy");
    const logs = doc.sections.find((s) => s.title === "Logs");
    assert.ok(logs && logs.body.length > 0);
    assert.ok(logs.body.some((p) => p.includes("do not include receipt photos")));
    for (const section of doc.sections) {
      assert.ok(section.body.length > 0, `section "${section.title}" should have body`);
    }
  });
});
