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
  it("orders missing, deadline center slot, progress, optional cpa", () => {
    const withAll = mockData({
      missing: missingResult(),
      showCpaReady: true,
    });
    assert.deepEqual(buildWidgetPageKeys(withAll), [
      "missing",
      "deadline",
      "progress",
      "cpa",
    ]);
  });

  it("omits missing when empty", () => {
    assert.deepEqual(buildWidgetPageKeys(mockData()), ["deadline", "progress"]);
  });
});

describe("buildWidgetPages", () => {
  it("splits four widgets into two pages", () => {
    const pages = buildWidgetPages(
      mockData({
        missing: missingResult(),
        showCpaReady: true,
      }),
    );
    assert.equal(pages.length, 2);
    assert.deepEqual(pages[0], ["missing", "deadline", "progress"]);
    assert.deepEqual(pages[1], ["cpa"]);
  });

  it("keeps three widgets on one page", () => {
    const pages = buildWidgetPages(
      mockData({
        missing: missingResult(),
      }),
    );
    assert.equal(pages.length, 1);
    assert.equal(pages[0]?.length, 3);
  });

  it("uses one page with two keys when missing hidden", () => {
    const pages = buildWidgetPages(mockData());
    assert.deepEqual(pages, [["deadline", "progress"]]);
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
