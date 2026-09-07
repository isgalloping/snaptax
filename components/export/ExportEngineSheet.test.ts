import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EN_US_COPY } from "@/lib/i18n/locales/en-US";
import { EXPORT_ENGINE_FORMAT_OPTIONS } from "./ExportEngineSheet.tsx";

describe("EXPORT_ENGINE_FORMAT_OPTIONS", () => {
  it("keeps the export wizard focused on tax pack file formats", () => {
    assert.deepEqual(
      EXPORT_ENGINE_FORMAT_OPTIONS.map((option) => option.format),
      ["cpa_pdf", "txf", "csv", "cpa_pack", "qif", "qbo"],
    );
  });

  it("does not reintroduce 1099 income capture actions into the export wizard", () => {
    const captureActions = new Set(["1099-NEC", "1099-K"]);

    assert.equal(
      EXPORT_ENGINE_FORMAT_OPTIONS.some((option) =>
        captureActions.has(option.format),
      ),
      false,
    );
  });

  it("resolves every title and hint copy key used by the picker", () => {
    for (const option of EXPORT_ENGINE_FORMAT_OPTIONS) {
      assert.equal(typeof EN_US_COPY.exportEngine[option.titleKey], "string");
      assert.equal(typeof EN_US_COPY.exportEngine[option.hintKey], "string");
    }
  });
});
