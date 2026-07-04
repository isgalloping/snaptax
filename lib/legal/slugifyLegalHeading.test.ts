import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slugifyLegalHeading } from "./slugifyLegalHeading";

describe("slugifyLegalHeading", () => {
  it("kebab-cases English headings", () => {
    assert.equal(
      slugifyLegalHeading("Subscriptions & Payments"),
      "subscriptions-payments",
    );
  });

  it("strips diacritics for French headings", () => {
    assert.equal(
      slugifyLegalHeading("Abonnements & paiements"),
      "abonnements-paiements",
    );
  });
});
