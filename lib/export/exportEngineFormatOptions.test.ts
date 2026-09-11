import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXPORT_ENGINE_FORMAT_OPTIONS,
  exportEngineFormatValues,
  selectedExportFormatLabel,
} from "./exportEngineFormatOptions.ts";

const titleCopy = {
  formatCsvTitle: "TurboTax CSV",
  formatCpaTitle: "1099 Audit Receipt Pack (ZIP)",
  formatCpaPdfTitle: "Schedule C Mirror PDF",
  formatTxfTitle: "TXF for Tax Software",
  formatQifTitle: "QuickBooks QIF",
  formatQboTitle: "QuickBooks Online",
};

describe("EXPORT_ENGINE_FORMAT_OPTIONS", () => {
  it("contains only tax-pack export formats in the wizard order", () => {
    assert.deepEqual(exportEngineFormatValues(), [
      "cpa_pdf",
      "txf",
      "csv",
      "cpa_pack",
      "qif",
      "qbo",
    ]);
    assert.equal(
      new Set(exportEngineFormatValues()).size,
      EXPORT_ENGINE_FORMAT_OPTIONS.length,
    );
  });

  it("excludes server-only and income-capture actions from the format picker", () => {
    const formats = new Set<string>(exportEngineFormatValues());

    assert.equal(formats.has("xlsx"), false);
    assert.equal(formats.has("1099-NEC"), false);
    assert.equal(formats.has("1099-K"), false);
  });

  it("keeps selected-format labels derived from the same option list", () => {
    for (const option of EXPORT_ENGINE_FORMAT_OPTIONS) {
      assert.equal(
        selectedExportFormatLabel(option.format, titleCopy),
        titleCopy[option.titleKey],
      );
    }
  });
});
