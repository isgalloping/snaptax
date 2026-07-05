import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isLegalHubSection, omitLegalHubSections } from "./omitLegalHubSections";

describe("omitLegalHubSections", () => {
  it("detects related section titles", () => {
    assert.equal(isLegalHubSection("Related policies"), true);
    assert.equal(isLegalHubSection("Related"), true);
    assert.equal(isLegalHubSection("Taxes"), false);
  });

  it("removes hub sections only", () => {
    const sections = omitLegalHubSections([
      { title: "Taxes", body: ["Paddle may add VAT."] },
      { title: "Related policies", body: ["[Privacy](/privacy)"] },
    ]);
    assert.equal(sections.length, 1);
    assert.equal(sections[0]?.title, "Taxes");
  });
});
