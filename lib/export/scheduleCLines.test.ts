import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SCHEDULE_C_PART_II_LINES,
  scheduleCLineKeyFromLabel,
  sumExportAmountsByLineKey,
  zipFolderForScheduleCLine,
} from "./scheduleCLines.ts";

describe("scheduleCLines", () => {
  it("exports 17 Part II lines in IRS order", () => {
    assert.equal(SCHEDULE_C_PART_II_LINES.length, 17);
    assert.equal(SCHEDULE_C_PART_II_LINES[0]!.key, "8");
    assert.equal(SCHEDULE_C_PART_II_LINES[1]!.key, "9");
    assert.equal(SCHEDULE_C_PART_II_LINES.at(-1)!.key, "27a");
  });

  it("maps Line label to key", () => {
    assert.equal(scheduleCLineKeyFromLabel("Line 9"), "9");
    assert.equal(scheduleCLineKeyFromLabel("Line 24b"), "24b");
  });

  it("resolves zip folder for Line 9", () => {
    assert.equal(
      zipFolderForScheduleCLine("Line 9"),
      "Line_09_Car_and_truck_expenses",
    );
  });

  it("sums export amounts by line key", () => {
    const totals = sumExportAmountsByLineKey([
      { scheduleCLine: "Line 22", exportAmount: 100 },
      { scheduleCLine: "Line 22", exportAmount: 25.5 },
      { scheduleCLine: "Line 9", exportAmount: 50 },
    ]);
    assert.equal(totals.get("22"), 125.5);
    assert.equal(totals.get("9"), 50);
  });
});
