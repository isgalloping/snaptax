import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXPORT_ENGINE_FORMAT_OPTIONS,
  exportEngineFormatTitle,
} from "@/lib/export/exportEngineFormatOptions";
import { EN_US_COPY } from "@/lib/i18n/locales/en-US";

describe("exportEngineFormatOptions", () => {
  it("keeps the export wizard focused on tax-pack formats only", () => {
    const formats = EXPORT_ENGINE_FORMAT_OPTIONS.map((option) => option.format);
    assert.deepEqual(
      formats,
      ["cpa_pdf", "txf", "csv", "cpa_pack", "qif", "qbo"],
    );
    assert.equal((formats as readonly string[]).includes("xlsx"), false);
    assert.equal(
      EXPORT_ENGINE_FORMAT_OPTIONS.some((option) =>
        /1099|income/i.test(`${option.titleKey} ${option.hintKey}`),
      ),
      false,
    );
  });

  it("uses copy keys that exist on the export engine copy", () => {
    const copy = EN_US_COPY.exportEngine;
    for (const option of EXPORT_ENGINE_FORMAT_OPTIONS) {
      assert.equal(typeof copy[option.titleKey], "string");
      assert.equal(typeof copy[option.hintKey], "string");
    }
  });

  it("resolves selected format titles from the same option list", () => {
    assert.equal(
      exportEngineFormatTitle(EN_US_COPY.exportEngine, "cpa_pdf"),
      "Schedule C Mirror PDF",
    );
    assert.equal(
      exportEngineFormatTitle(EN_US_COPY.exportEngine, "qbo"),
      "QuickBooks Online",
    );
  });
});
