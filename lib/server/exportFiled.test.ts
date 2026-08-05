import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  markExportFiledForUser,
  type ExportFiledServerDeps,
} from "./exportFiled.ts";

type TestReceipt = {
  id: string;
  capturedAt: Date;
  snapAt: Date | null;
  category?: string | null;
};

function receipt(
  id: string,
  capturedAt: string,
  overrides: Partial<TestReceipt> = {},
): TestReceipt {
  return {
    id,
    capturedAt: new Date(capturedAt),
    snapAt: null,
    ...overrides,
  };
}

function createDeps(options: {
  entitlementStatus?: string | null;
  ghostId?: string | null;
  receipts?: TestReceipt[];
}) {
  const calls = {
    receiptWhere: null as unknown,
    update: null as
      | {
          receiptIds: string[];
          taxSeason: string;
          taxSeasonDate: Date;
        }
      | null,
    logs: [] as unknown[],
  };
  const deps: ExportFiledServerDeps<TestReceipt> = {
    currentSeason: () => "2026",
    now: () => new Date("2026-07-08T12:00:00.000Z"),
    findSeasonEntitlement: async ({ userId, taxSeason }) => {
      assert.equal(userId, "user-1");
      assert.equal(taxSeason, "2026");
      const status = options.entitlementStatus ?? "active";
      return status == null ? null : { status };
    },
    findGhostBinding: async (userId) => {
      assert.equal(userId, "user-1");
      return options.ghostId === undefined
        ? { ghostId: "ghost-bound" }
        : options.ghostId == null
          ? null
          : { ghostId: options.ghostId };
    },
    findDoneReceipts: async (where) => {
      calls.receiptWhere = where;
      return options.receipts ?? [];
    },
    updateReceiptsFiled: async (params) => {
      calls.update = params;
      return params.receiptIds.length;
    },
    logExportFiled: (entry) => {
      calls.logs.push(entry);
    },
  };
  return { deps, calls };
}

describe("markExportFiledForUser", () => {
  it("requires a paid current-season entitlement before reading receipts", async () => {
    let readReceipts = false;
    const { deps } = createDeps({ entitlementStatus: "past_due" });
    deps.findDoneReceipts = async () => {
      readReceipts = true;
      return [];
    };

    const result = await markExportFiledForUser(
      {
        userId: "user-1",
        taxYear: "2026",
        timeZone: "UTC",
      },
      deps,
    );

    assert.deepEqual(result, {
      ok: false,
      code: "PAYMENT_REQUIRED",
      message: "Tax season export not paid",
      status: 402,
    });
    assert.equal(readReceipts, false);
  });

  it("marks only requested ids that belong to the actor and tax year", async () => {
    const { deps, calls } = createDeps({
      receipts: [
        receipt("eligible", "2026-03-01T12:00:00.000Z"),
        receipt("other-year", "2025-03-01T12:00:00.000Z"),
      ],
    });

    const result = await markExportFiledForUser(
      {
        userId: "user-1",
        taxYear: "2026",
        timeZone: "UTC",
        receiptIds: ["eligible", "local-only", "other-year"],
      },
      deps,
    );

    assert.deepEqual(calls.receiptWhere, {
      OR: [{ userId: "user-1" }, { ghostId: "ghost-bound", userId: null }],
      status: "done",
    });
    assert.deepEqual(calls.update, {
      receiptIds: ["eligible"],
      taxSeason: "2026",
      taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
    });
    assert.deepEqual(result, {
      ok: true,
      taxSeason: "2026",
      taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
      filedCount: 1,
      receiptIds: ["eligible"],
    });
    assert.deepEqual(calls.logs, [
      {
        ts: "2026-07-08T12:00:00.000Z",
        userId: "user-1",
        taxSeason: "2026",
        receiptCount: 1,
        skippedReceiptIds: 2,
      },
    ]);
  });

  it("returns NO_RECEIPTS when requested ids are all filtered out", async () => {
    const { deps, calls } = createDeps({
      receipts: [receipt("other-year", "2025-03-01T12:00:00.000Z")],
    });

    const result = await markExportFiledForUser(
      {
        userId: "user-1",
        taxYear: "2026",
        timeZone: "UTC",
        receiptIds: ["other-year"],
      },
      deps,
    );

    assert.deepEqual(result, {
      ok: false,
      code: "NO_RECEIPTS",
      message: "No completed receipts to file for tax year",
      status: 422,
    });
    assert.equal(calls.update, null);
    assert.deepEqual(calls.logs, []);
  });

  it("marks every done receipt in the tax year when receipt ids are omitted", async () => {
    const { deps, calls } = createDeps({
      ghostId: null,
      receipts: [
        receipt("first", "2026-02-01T12:00:00.000Z"),
        receipt("income", "2026-02-02T12:00:00.000Z", {
          category: "1099-NEC",
        }),
        receipt("old", "2025-02-01T12:00:00.000Z"),
      ],
    });

    const result = await markExportFiledForUser(
      {
        userId: "user-1",
        taxYear: "2026",
        timeZone: "UTC",
      },
      deps,
    );

    assert.deepEqual(calls.receiptWhere, {
      userId: "user-1",
      status: "done",
    });
    assert.deepEqual(calls.update?.receiptIds, ["first", "income"]);
    assert.deepEqual(result, {
      ok: true,
      taxSeason: "2026",
      taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
      filedCount: 2,
      receiptIds: ["first", "income"],
    });
  });
});
