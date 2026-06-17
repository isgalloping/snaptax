import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeTaxYearProgress } from "@/lib/home/computeTaxYearProgress";

describe("computeTaxYearProgress", () => {
  it("computes percent elapsed and projected savings", () => {
    const result = computeTaxYearProgress(100, {
      now: new Date("2026-07-01T12:00:00.000Z"),
      timeZone: "UTC",
    });
    assert.ok(result.progressPct > 0 && result.progressPct <= 100);
    assert.equal(result.year, 2026);
    assert.ok(result.projectedSavings != null && result.projectedSavings > 100);
  });

  it("null projected when taxSaved is 0", () => {
    const result = computeTaxYearProgress(0, {
      now: new Date("2026-07-01T12:00:00.000Z"),
      timeZone: "UTC",
    });
    assert.equal(result.projectedSavings, null);
  });
});
