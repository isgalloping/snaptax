import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXPORT_ENGINE_FORMAT_OPTIONS,
  exportEngineSelectedFormatLabelKey,
} from "./ExportEngineSheet";

describe("EXPORT_ENGINE_FORMAT_OPTIONS", () => {
  it("keeps the export wizard limited to real tax-pack formats", () => {
    assert.deepEqual(
      EXPORT_ENGINE_FORMAT_OPTIONS.map((option) => option.format),
      ["cpa_pdf", "txf", "csv", "cpa_pack", "qif", "qbo"],
    );
    const formats = EXPORT_ENGINE_FORMAT_OPTIONS.map((option) => option.format);
    assert.equal((formats as readonly string[]).includes("xlsx"), false);
  });

  it("does not include income-capture-only actions in the export wizard", () => {
    const formats = new Set<string>(
      EXPORT_ENGINE_FORMAT_OPTIONS.map((option) => option.format),
    );

    assert.equal(formats.has("1099-NEC"), false);
    assert.equal(formats.has("1099-K"), false);
  });
});

describe("exportEngineSelectedFormatLabelKey", () => {
  it("maps every visible format to its selected-state label", () => {
    assert.deepEqual(
      EXPORT_ENGINE_FORMAT_OPTIONS.map((option) =>
        exportEngineSelectedFormatLabelKey(option.format),
      ),
      [
        "formatCpaPdfTitle",
        "formatTxfTitle",
        "formatCsvTitle",
        "formatCpaTitle",
        "formatQifTitle",
        "formatQboTitle",
      ],
    );
  });
});
