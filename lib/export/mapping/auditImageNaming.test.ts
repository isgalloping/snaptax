import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuditImageFilename,
  buildAuditImagePath,
} from "./auditImageNaming.ts";

describe("auditImageNaming", () => {
  it("builds PRD filename with dollar amount and index", () => {
    assert.equal(
      buildAuditImageFilename({
        dateIso: "2025-02-14",
        merchant: "Shell Gas",
        exportAmount: 75.5,
        auditIndex: "001",
      }),
      "20250214_Shell_Gas_$75.50_001.jpg",
    );
  });

  it("builds full archive path under Line folder", () => {
    assert.equal(
      buildAuditImagePath({
        scheduleCLine: "Line 9",
        dateIso: "2025-02-14",
        merchant: "Shell Gas",
        exportAmount: 75.5,
        auditIndex: "001",
      }),
      "Line_09_Car_and_truck_expenses/20250214_Shell_Gas_$75.50_001.jpg",
    );
  });
});
