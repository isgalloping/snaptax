import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import { computeMissingDeductions } from "@/lib/home/computeMissingDeductions";

describe("computeMissingDeductions", () => {
  it("returns missing hints when category not tracked", () => {
    const receipts: Receipt[] = [
      {
        id: "1",
        status: "done",
        category: "TOOLS",
        timestamp: new Date("2026-02-01T12:00:00.000Z"),
      },
    ];
    const result = computeMissingDeductions(receipts, "electrician", {
      now: new Date("2026-06-01T12:00:00.000Z"),
      timeZone: "UTC",
      marginalRate: 0.25,
    });
    assert.ok(result.missing.some((m) => m.label === "Vehicle Mileage"));
    assert.ok(!result.missing.some((m) => m.label === "Tools & Equipment"));
    assert.ok(result.totalTaxEstimate > 0);
  });

  it("empty missing when all hints tracked", () => {
    const receipts: Receipt[] = [
      {
        id: "1",
        status: "done",
        category: "TOOLS",
        timestamp: new Date("2026-02-01T12:00:00.000Z"),
      },
      {
        id: "2",
        status: "done",
        category: "SAFETY",
        timestamp: new Date("2026-03-01T12:00:00.000Z"),
      },
      {
        id: "3",
        status: "done",
        category: "TRUCK GAS",
        timestamp: new Date("2026-04-01T12:00:00.000Z"),
      },
    ];
    const result = computeMissingDeductions(receipts, "electrician", {
      now: new Date("2026-06-01T12:00:00.000Z"),
      timeZone: "UTC",
    });
    assert.equal(result.missing.length, 0);
  });
});
