import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isFilingTaxSeason,
  isWithinEstimatedTaxDeadlineWindow,
  shouldShowCpaReadyWidget,
} from "./shouldShowCpaReadyWidget";

describe("shouldShowCpaReadyWidget", () => {
  it("shows during Jan–Apr filing season", () => {
    assert.equal(
      shouldShowCpaReadyWidget(new Date("2026-03-01T12:00:00.000Z"), "UTC"),
      true,
    );
    assert.equal(
      shouldShowCpaReadyWidget(new Date("2026-05-01T12:00:00.000Z"), "UTC"),
      false,
    );
  });

  it("shows within 15 days of estimated tax deadline", () => {
    assert.equal(
      isWithinEstimatedTaxDeadlineWindow(
        new Date("2026-09-01T12:00:00.000Z"),
        15,
        "UTC",
      ),
      true,
    );
    assert.equal(
      isWithinEstimatedTaxDeadlineWindow(
        new Date("2026-06-16T12:00:00.000Z"),
        15,
        "UTC",
      ),
      false,
    );
  });

  it("isFilingTaxSeason respects local timezone month", () => {
    assert.equal(
      isFilingTaxSeason(new Date("2026-04-30T23:00:00.000Z"), "America/New_York"),
      true,
    );
  });
});
