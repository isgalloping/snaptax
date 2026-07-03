import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWidgetPageKeys,
  buildWidgetPages,
  chunkPages,
  pageColumnFlexClass,
} from "./buildWidgetPages.ts";
import type { HomeWidgetsData } from "./computeHomeWidgets.ts";

function mockData(overrides: Partial<HomeWidgetsData> = {}): HomeWidgetsData {
  return {
    deadline: {
      quarterLabel: "Q2 Estimated Tax",
      daysLeft: 20,
      urgency: "attention",
      projectedPayment: null,
    },
    missing: { missing: [], previewLabels: [], totalTaxEstimate: 0 },
    progress: { year: 2026, progressPct: 45, projectedSavings: null },
    cpaReadyCount: 3,
    showCpaReady: false,
    ...overrides,
  };
}

function missingItem() {
  return {
    hint: {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["MILEAGE"],
      defaultEstimate: 2000,
      whyItMatters: "test",
    },
    label: "Vehicle Mileage",
    taxEstimate: 100,
  };
}

function missingResult() {
  return {
    missing: [missingItem()],
    previewLabels: ["Vehicle Mileage"],
    totalTaxEstimate: 100,
  };
}

describe("buildWidgetPageKeys", () => {
  it("orders deadline and progress by default", () => {
    assert.deepEqual(buildWidgetPageKeys(mockData()), ["deadline", "progress"]);
  });

  it("omits missing when SHOW_MISSING_DEDUCTIONS_WIDGET is false", () => {
    assert.deepEqual(buildWidgetPageKeys(mockData({ missing: missingResult() })), [
      "deadline",
      "progress",
    ]);
  });

  it("places needAction second when action receipts exist", () => {
    assert.deepEqual(buildWidgetPageKeys(mockData(), 2), [
      "deadline",
      "needAction",
      "progress",
    ]);
  });

  it("places needAction second when missing widget hidden but hints exist", () => {
    assert.deepEqual(
      buildWidgetPageKeys(mockData({ missing: missingResult() }), 1),
      ["deadline", "needAction", "progress"],
    );
  });

  it("places cpa third when action and tax season", () => {
    assert.deepEqual(buildWidgetPageKeys(mockData({ showCpaReady: true }), 2), [
      "deadline",
      "needAction",
      "cpa",
      "progress",
    ]);
  });

  it("orders needAction cpa without missing when widget hidden", () => {
    assert.deepEqual(
      buildWidgetPageKeys(
        mockData({ missing: missingResult(), showCpaReady: true }),
        1,
      ),
      ["deadline", "needAction", "cpa", "progress"],
    );
  });

  it("keeps cpa fourth when no action receipts", () => {
    assert.deepEqual(buildWidgetPageKeys(mockData({ showCpaReady: true })), [
      "deadline",
      "progress",
      "cpa",
    ]);
  });

  it("keeps cpa fourth with missing hints but widget hidden", () => {
    assert.deepEqual(
      buildWidgetPageKeys(
        mockData({ missing: missingResult(), showCpaReady: true }),
      ),
      ["deadline", "progress", "cpa"],
    );
  });

  it("prepends founder when showFounder is true", () => {
    assert.deepEqual(
      buildWidgetPageKeys(mockData(), 0, { showFounder: true }),
      ["founder", "deadline", "progress"],
    );
  });

  it("omits founder when showFounder is false", () => {
    assert.deepEqual(
      buildWidgetPageKeys(mockData(), 0, { showFounder: false }),
      ["deadline", "progress"],
    );
  });
});

describe("buildWidgetPages", () => {
  it("puts needAction on first page as second card", () => {
    const pages = buildWidgetPages(mockData(), 2);
    assert.deepEqual(pages[0], ["deadline", "needAction", "progress"]);
  });

  it("puts needAction and cpa on first page when tax season with action", () => {
    const pages = buildWidgetPages(mockData({ showCpaReady: true }), 1);
    assert.deepEqual(pages[0], ["deadline", "needAction", "cpa"]);
    assert.deepEqual(pages[1], ["progress"]);
  });

  it("paginates four widgets without missing when widget hidden", () => {
    const pages = buildWidgetPages(
      mockData({ missing: missingResult(), showCpaReady: true }),
      1,
    );
    assert.deepEqual(pages[0], ["deadline", "needAction", "cpa"]);
    assert.deepEqual(pages[1], ["progress"]);
  });

  it("keeps two widgets on one page when missing hints but widget hidden", () => {
    const pages = buildWidgetPages(mockData({ missing: missingResult() }));
    assert.equal(pages.length, 1);
    assert.equal(pages[0]?.length, 2);
    assert.deepEqual(pages[0], ["deadline", "progress"]);
  });

  it("puts founder alone on page one when showFounder", () => {
    const pages = buildWidgetPages(mockData(), 2, { showFounder: true });
    assert.deepEqual(pages[0], ["founder"]);
    assert.deepEqual(pages[1], ["deadline", "needAction", "progress"]);
  });

  it("paginates founder page before deadline and progress", () => {
    const pages = buildWidgetPages(mockData(), 0, { showFounder: true });
    assert.deepEqual(pages[0], ["founder"]);
    assert.deepEqual(pages[1], ["deadline", "progress"]);
    assert.equal(pages.length, 2);
  });
});

describe("chunkPages", () => {
  it("preserves order", () => {
    assert.deepEqual(chunkPages([1, 2, 3, 4]), [[1, 2, 3], [4]]);
  });
});

describe("pageColumnFlexClass", () => {
  it("maps column counts to flex classes", () => {
    assert.match(pageColumnFlexClass(1), /100%/);
    assert.match(pageColumnFlexClass(2), /50%/);
    assert.match(pageColumnFlexClass(3), /33/);
  });
});
