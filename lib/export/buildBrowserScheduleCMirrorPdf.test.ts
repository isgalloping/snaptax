import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBrowserScheduleCMirrorPdf } from "./buildBrowserScheduleCMirrorPdf.ts";

describe("buildBrowserScheduleCMirrorPdf", () => {
  it("returns a valid PDF byte array", async () => {
    const bytes = await buildBrowserScheduleCMirrorPdf({
      taxYear: "2025",
      taxpayerName: "Jane Contractor",
      businessIndustry: "Independent Contractor",
      auditRows: [],
      incomeRows: [],
    });
    assert.equal(String.fromCharCode(...bytes.subarray(0, 5)), "%PDF-");
    assert.ok(bytes.length > 500);
  });
});
