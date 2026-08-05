import { isSeasonEntitlementPaid } from "@/lib/billing/isSeasonEntitlementPaid";
import { resolveFiledReceiptIds } from "@/lib/export/resolveFiledReceiptIds";
import { prisma } from "@/lib/prisma";
import { userAccountReceiptFilter } from "@/lib/receipts/accountCleanup";
import { logEvent } from "@/lib/server/log/logEvent";
import { currentTaxSeason } from "@/lib/tax/season";
import type { TaxYearFilterableReceipt } from "@/lib/tax/exportRows";
import { utcNow } from "@/lib/time/utc";

export type ExportFiledServerParams = {
  userId: string;
  taxYear: string;
  timeZone: string;
  receiptIds?: string[];
};

export type ExportFiledServerResult =
  | {
      ok: true;
      taxSeason: string;
      taxSeasonDate: Date;
      filedCount: number;
      receiptIds: string[];
      skippedReceiptIds?: number;
    }
  | {
      ok: false;
      code: "PAYMENT_REQUIRED" | "NO_RECEIPTS";
      message: string;
      status: 402 | 422;
    };

export type ExportFiledPaymentGateResult =
  | { ok: true }
  | {
      ok: false;
      code: "PAYMENT_REQUIRED";
      message: string;
      status: 402;
    };

export type ExportFiledLogEntry = {
  ts: string;
  userId: string;
  taxSeason: string;
  receiptCount: number;
  skippedReceiptIds?: number;
};

export type ExportFiledServerOptions = {
  paidEntitlementChecked?: boolean;
};

export type ExportFiledServerDeps<
  R extends TaxYearFilterableReceipt = TaxYearFilterableReceipt,
> = {
  currentSeason: () => string;
  now: () => Date;
  findSeasonEntitlement: (params: {
    userId: string;
    taxSeason: string;
  }) => Promise<{ status: string | null } | null>;
  findGhostBinding: (
    userId: string,
  ) => Promise<{ ghostId: string } | null>;
  findDoneReceipts: (where: unknown) => Promise<R[]>;
  updateReceiptsFiled: (params: {
    receiptIds: string[];
    taxSeason: string;
    taxSeasonDate: Date;
  }) => Promise<number>;
  logExportFiled: (entry: ExportFiledLogEntry) => void;
};

function defaultExportFiledDeps(): ExportFiledServerDeps {
  return {
    currentSeason: currentTaxSeason,
    now: utcNow,
    findSeasonEntitlement: async ({ userId, taxSeason }) =>
      prisma.snaptaxSeasonEntitlement.findUnique({
        where: {
          userId_taxSeason: { userId, taxSeason },
        },
        select: { status: true },
      }),
    findGhostBinding: async (userId) =>
      prisma.snaptaxGhostAccount.findUnique({
        where: { userId },
        select: { ghostId: true },
      }),
    findDoneReceipts: async (where) =>
      prisma.snaptaxReceipt.findMany({ where: where as never }),
    updateReceiptsFiled: async ({ receiptIds, taxSeason, taxSeasonDate }) => {
      const result = await prisma.snaptaxReceipt.updateMany({
        where: { id: { in: receiptIds } },
        data: { taxSeason, taxSeasonDate },
      });
      return result.count;
    },
    logExportFiled: (entry) => {
      logEvent({
        ts: entry.ts,
        module: "biz.export",
        level: "info",
        success: true,
        durationMs: 0,
        userId: entry.userId,
        meta: {
          taxSeason: entry.taxSeason,
          receiptCount: entry.receiptCount,
          reason: "local_export_filed",
          ...(entry.skippedReceiptIds && entry.skippedReceiptIds > 0
            ? { skippedReceiptIds: entry.skippedReceiptIds }
            : {}),
        },
      });
    },
  };
}

export async function resolveExportFiledPaymentGate<
  R extends TaxYearFilterableReceipt = TaxYearFilterableReceipt,
>(
  userId: string,
  deps: Pick<
    ExportFiledServerDeps<R>,
    "currentSeason" | "findSeasonEntitlement"
  > = defaultExportFiledDeps(),
): Promise<ExportFiledPaymentGateResult> {
  const season = deps.currentSeason();
  const entitlement = await deps.findSeasonEntitlement({
    userId,
    taxSeason: season,
  });
  if (!entitlement || !isSeasonEntitlementPaid(entitlement.status)) {
    return {
      ok: false,
      code: "PAYMENT_REQUIRED",
      message: "Tax season export not paid",
      status: 402,
    };
  }
  return { ok: true };
}

export async function markExportFiledForUser<
  R extends TaxYearFilterableReceipt = TaxYearFilterableReceipt,
>(
  params: ExportFiledServerParams,
  deps: ExportFiledServerDeps<R> = defaultExportFiledDeps() as ExportFiledServerDeps<R>,
  options: ExportFiledServerOptions = {},
): Promise<ExportFiledServerResult> {
  if (!options.paidEntitlementChecked) {
    const gate = await resolveExportFiledPaymentGate(params.userId, deps);
    if (!gate.ok) {
      return gate;
    }
  }

  const binding = await deps.findGhostBinding(params.userId);
  const receiptWhere = {
    ...userAccountReceiptFilter(params.userId, binding?.ghostId ?? null),
    status: "done",
  };
  const allDone = await deps.findDoneReceipts(receiptWhere);
  const filedSelection = resolveFiledReceiptIds(
    allDone,
    Number(params.taxYear),
    params.timeZone,
    params.receiptIds,
  );
  if (!filedSelection.ok) {
    return {
      ok: false,
      code: "NO_RECEIPTS",
      message: "No completed receipts to file for tax year",
      status: 422,
    };
  }

  const receiptIds = filedSelection.receiptIds;
  const skippedCount =
    params.receiptIds != null ? params.receiptIds.length - receiptIds.length : 0;
  const exportedAt = deps.now();
  const filedCount = await deps.updateReceiptsFiled({
    receiptIds,
    taxSeason: params.taxYear,
    taxSeasonDate: exportedAt,
  });

  deps.logExportFiled({
    ts: exportedAt.toISOString(),
    userId: params.userId,
    taxSeason: params.taxYear,
    receiptCount: filedCount,
    ...(skippedCount > 0 ? { skippedReceiptIds: skippedCount } : {}),
  });

  return {
    ok: true,
    taxSeason: params.taxYear,
    taxSeasonDate: exportedAt,
    filedCount,
    receiptIds,
    ...(skippedCount > 0 ? { skippedReceiptIds: skippedCount } : {}),
  };
}
