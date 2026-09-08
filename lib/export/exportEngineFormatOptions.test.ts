import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXPORT_ENGINE_FORMAT_OPTIONS,
  exportEngineSelectedFormatLabel,
} from "./exportEngineFormatOptions.ts";

const copy = {
  formatCpaPdfTitle: "Schedule C PDF",
  formatCpaPdfHint: "PDF hint",
  formatTxfTitle: "TXF",
  formatTxfHint: "TXF hint",
  formatCsvTitle: "TurboTax CSV",
  formatCsvHint: "CSV hint",
  formatCpaTitle: "CPA pack",
  formatCpaHint: "CPA pack hint",
  formatQifTitle: "QuickBooks QIF",
  formatQifHint: "QIF hint",
  formatQboTitle: "QuickBooks Online QBO",
  formatQboHint: "QBO hint",
};

describe("EXPORT_ENGINE_FORMAT_OPTIONS", () => {
  it("offers only tax-pack output formats in the export wizard", () => {
    assert.deepEqual(
      EXPORT_ENGINE_FORMAT_OPTIONS.map((option) => option.format),
      ["cpa_pdf", "txf", "csv", "cpa_pack", "qif", "qbo"],
    );

    const exposedFormats = new Set<string>(
      EXPORT_ENGINE_FORMAT_OPTIONS.map((option) => option.format),
    );
    for (const forbidden of ["xlsx", "1099-NEC", "1099-K"]) {
      assert.equal(
        exposedFormats.has(forbidden),
        false,
        `${forbidden} must not be shown as an export wizard format`,
      );
    }
  });

  it("derives selected labels from the same option list rendered by the wizard", () => {
    for (const option of EXPORT_ENGINE_FORMAT_OPTIONS) {
      assert.equal(
        exportEngineSelectedFormatLabel(option.format, copy),
        copy[option.titleKey],
      );
    }
  });
});
