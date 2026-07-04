import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAuditDetailCsv } from "./buildAuditDetailCsv.ts";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

describe("buildAuditDetailCsv", () => {
  it("includes Audit_Image_Path and Receipt_Image_URL with same value", () => {
    const path = "Line_22_Supplies/20260315_HomeDepot_$125.50_001.jpg";
    const csv = buildAuditDetailCsv([
      {
        dateIso: "2026-03-15",
        merchant: "Home Depot",
        categoryDisplay: "Supplies",
        exportAmount: 125.5,
        notes: "",
        auditImagePath: path,
      } as ExportExpenseRow,
    ]);
    assert.match(csv, /Audit_Image_Path/);
    assert.match(csv, /Receipt_Image_URL/);
    const lines = csv.split("\r\n");
    assert.equal(lines.length, 2);
    assert.ok(lines[1]!.includes(path));
    const pathCount = (lines[1]!.match(/Line_22_Supplies/g) ?? []).length;
    assert.equal(pathCount, 2);
  });
});
