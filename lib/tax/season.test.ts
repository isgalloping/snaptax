import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { currentTaxSeason, defaultExportTaxYear, filingTaxYearForSeason } from "@/lib/tax/season";

describe("currentTaxSeason", () => {
  it("returns UTC calendar year during filing season (Jan–Apr)", () => {
    assert.equal(
      currentTaxSeason(new Date("2026-03-15T12:00:00.000Z")),
      "2026",
    );
  });

  it("returns next calendar year after filing season (May–Dec)", () => {
    assert.equal(
      currentTaxSeason(new Date("2026-06-15T12:00:00.000Z")),
      "2027",
    );
  });
});

describe("defaultExportTaxYear", () => {
  it("always returns the UTC calendar year", () => {
    assert.equal(
      defaultExportTaxYear(new Date("2026-06-15T12:00:00.000Z")),
      "2026",
    );
  });
});

describe("filingTaxYearForSeason", () => {
  it("maps season label to calendar tax year", () => {
    assert.equal(filingTaxYearForSeason("2027"), 2026);
    assert.equal(filingTaxYearForSeason("2026"), 2025);
  });
});
