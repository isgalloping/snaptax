import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  exportPreviewCsvFilename,
  exportShareTitle,
  exportTaxPackFilename,
  sampleTurboTaxCsvFilename,
} from "@/lib/export/exportFilenames";

describe("exportFilenames", () => {
  it("builds tax-pack filenames with SnapTax brand", () => {
    assert.equal(
      exportTaxPackFilename("csv", "2025"),
      "SnapTax-2025-TurboTax-Expenses.csv",
    );
    assert.equal(
      exportTaxPackFilename("cpa_pack", 2026),
      "SnapTax-2026-Audit-Trail.zip",
    );
    assert.equal(
      exportTaxPackFilename("cpa_pdf", "2025"),
      "SnapTax-2025-Schedule-C-Mirror.pdf",
    );
    assert.equal(
      exportTaxPackFilename("txf", "2025"),
      "SnapTax-2025-Expenses.txf",
    );
    assert.equal(
      exportTaxPackFilename("xlsx", "2025"),
      "SnapTax-2025-Tax-Pack.xlsx",
    );
  });

  it("builds preview and sample filenames", () => {
    assert.equal(
      exportPreviewCsvFilename(2025),
      "SnapTax-2025-TurboTax-Preview.csv",
    );
    assert.equal(
      sampleTurboTaxCsvFilename("2025"),
      "SnapTax-SAMPLE-TurboTax-2025.csv",
    );
  });

  it("builds share titles", () => {
    assert.equal(exportShareTitle(2025), "SnapTax 2025");
    assert.equal(exportShareTitle("2025", "Preview"), "SnapTax 2025 Preview");
  });
});
