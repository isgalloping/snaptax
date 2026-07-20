import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildScheduleCMirrorPdf } from "./buildScheduleCMirrorPdf.ts";

describe("buildScheduleCMirrorPdf", () => {
  it("returns a valid PDF buffer", async () => {
    const buffer = await buildScheduleCMirrorPdf({
      taxYear: "2025",
      taxpayerName: "Jane Contractor",
      businessIndustry: "Independent Contractor",
      auditRows: [],
      incomeRows: [],
    });
    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
    assert.ok(buffer.length > 500);
  });
});
