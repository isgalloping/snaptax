import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasLocalizedLegalMarkdown,
  loadLegalMarkdown,
  parseLegalMarkdown,
} from "./markdownDoc";

describe("legal markdown docs", () => {
  it("loads pricing.md with expected sections", () => {
    const doc = parseLegalMarkdown(loadLegalMarkdown("pricing.md"));
    assert.equal(doc.title, "SnapTax Pricing");
    assert.ok(doc.sections.some((s) => s.title === "What you pay for"));
    assert.ok(doc.sections.some((s) => s.title === "Related policies"));
  });

  it("loads refund.md with expected sections", () => {
    const doc = parseLegalMarkdown(loadLegalMarkdown("refund.md"));
    assert.equal(doc.title, "SnapTax Refund Policy");
    assert.ok(doc.sections.some((s) => s.title === "How to request a refund"));
  });

  it("loads data-retention.md without internal repo paths", () => {
    const raw = loadLegalMarkdown("data-retention.md");
    assert.doesNotMatch(raw, /docs\//);
    assert.doesNotMatch(raw, /lib\//);
    assert.doesNotMatch(raw, /\.ts/);

    const doc = parseLegalMarkdown(raw);
    assert.equal(doc.title, "SnapTax Data Retention Policy");
    const logs = doc.sections.find((s) => s.title === "Logs");
    assert.ok(logs && logs.body.length > 0);
    assert.ok(logs.body.some((p) => p.includes("do not include receipt photos")));
    for (const section of doc.sections) {
      assert.ok(section.body.length > 0, `section "${section.title}" should have body`);
    }
  });

  it("loads cookies.md with essential cookies section", () => {
    const doc = parseLegalMarkdown(loadLegalMarkdown("cookies.md"));
    assert.equal(doc.title, "SnapTax Cookie Policy");
    assert.ok(doc.sections.some((s) => s.title === "Essential cookies"));
  });

  it("loads disclaimer.md", () => {
    const doc = parseLegalMarkdown(loadLegalMarkdown("disclaimer.md"));
    assert.equal(doc.title, "SnapTax Disclaimer");
    assert.ok(doc.sections.some((s) => s.title === "Tax estimates"));
  });

  it("loads localized data-retention for fr-FR and de-DE", () => {
    assert.equal(hasLocalizedLegalMarkdown("data-retention.md", "fr-FR"), true);
    assert.equal(hasLocalizedLegalMarkdown("data-retention.md", "de-DE"), true);

    const fr = parseLegalMarkdown(loadLegalMarkdown("data-retention.md", "fr-FR"));
    assert.match(fr.title, /conservation/i);
    const de = parseLegalMarkdown(loadLegalMarkdown("data-retention.md", "de-DE"));
    assert.match(de.title, /Datenspeicherung/i);
  });

  it("loads localized security-incident for fr-FR and de-DE", () => {
    assert.equal(hasLocalizedLegalMarkdown("security-incident.md", "fr-FR"), true);
    const fr = parseLegalMarkdown(
      loadLegalMarkdown("security-incident.md", "fr-FR"),
    );
    assert.match(fr.title, /Sécurité/i);
  });

  it("falls back to English when locale file missing", () => {
    assert.equal(hasLocalizedLegalMarkdown("pricing.md", "fr-FR"), false);
    const doc = parseLegalMarkdown(loadLegalMarkdown("pricing.md", "fr-FR"));
    assert.equal(doc.title, "SnapTax Pricing");
  });
});
