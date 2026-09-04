import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  EXPORT_ENGINE_FORMAT_ORDER,
  ExportFormatOptions,
  exportFormatTitle,
  isLocalCpaExportFormat,
  isLocalTaxExportFormat,
} from "@/components/export/ExportFormatOptions";
import { EN_US_COPY } from "@/lib/i18n/locales/en-US";

describe("ExportFormatOptions", () => {
  it("offers only tax-pack output formats in the export wizard", () => {
    assert.deepEqual(EXPORT_ENGINE_FORMAT_ORDER, [
      "cpa_pdf",
      "txf",
      "csv",
      "cpa_pack",
      "qif",
      "qbo",
    ]);

    const html = renderToStaticMarkup(
      React.createElement(ExportFormatOptions, {
        copy: EN_US_COPY.exportEngine,
        format: "cpa_pdf",
        onFormatChange: () => {},
      }),
    );

    for (const label of [
      EN_US_COPY.exportEngine.formatCpaPdfTitle,
      EN_US_COPY.exportEngine.formatTxfTitle,
      EN_US_COPY.exportEngine.formatCsvTitle,
      EN_US_COPY.exportEngine.formatCpaTitle,
      EN_US_COPY.exportEngine.formatQifTitle,
      EN_US_COPY.exportEngine.formatQboTitle,
    ]) {
      assert.match(html, new RegExp(escapeRegExp(label)));
    }

    assert.doesNotMatch(html, /1099 income forms/i);
    assert.doesNotMatch(html, /1099-NEC/i);
    assert.doesNotMatch(html, /1099-K/i);
  });

  it("routes each offered format to the expected local exporter family", () => {
    assert.deepEqual(
      EXPORT_ENGINE_FORMAT_ORDER.filter(isLocalTaxExportFormat),
      ["txf", "csv", "qif", "qbo"],
    );
    assert.deepEqual(
      EXPORT_ENGINE_FORMAT_ORDER.filter(isLocalCpaExportFormat),
      ["cpa_pdf", "cpa_pack"],
    );
    assert.equal(
      exportFormatTitle(EN_US_COPY.exportEngine, "qbo"),
      EN_US_COPY.exportEngine.formatQboTitle,
    );
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
