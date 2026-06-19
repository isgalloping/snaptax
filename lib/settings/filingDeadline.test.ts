import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysUntilFilingDeadline,
  isWithinFinalTaxPackWindow,
} from "@/lib/settings/filingDeadline";

describe("filingDeadline", () => {
  it("counts days until Apr 15 of season year", () => {
    const now = new Date("2027-04-10T12:00:00.000Z");
    assert.equal(daysUntilFilingDeadline("2027", now), 5);
  });

  it("returns negative after Apr 15", () => {
    const now = new Date("2027-04-16T12:00:00.000Z");
    assert.equal(daysUntilFilingDeadline("2027", now), -1);
  });

  it("final window is true when days left <= 7", () => {
    const now = new Date("2027-04-10T12:00:00.000Z");
    assert.equal(isWithinFinalTaxPackWindow("2027", now), true);
  });

  it("final window is false when days left > 7", () => {
    const now = new Date("2027-04-01T12:00:00.000Z");
    assert.equal(isWithinFinalTaxPackWindow("2027", now), false);
  });
});
