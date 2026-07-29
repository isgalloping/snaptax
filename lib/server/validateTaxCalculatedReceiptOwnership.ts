import { prisma } from "@/lib/prisma";
import type { Actor } from "@/lib/auth/getActor";
import {
  type ClientReceiptEvent,
  uniqueTaxCalculatedReceiptIds,
} from "@/lib/server/buildReceiptEventIngestPayload";
import { receiptWhereForActor } from "@/lib/receipts/ownership";

export const TAX_CALCULATED_RECEIPT_OWNERSHIP_ERROR_MESSAGE =
  "TAX_CALCULATED events must reference actor-owned receipts";

type ReceiptOwnershipDatabase = {
  snaptaxReceipt: {
    count(args: {
      where: {
        id: { in: string[] };
        ghostId?: string;
        userId?: string | null;
      };
    }): Promise<number>;
  };
};

export type TaxCalculatedReceiptOwnershipResult =
  | { ok: true }
  | {
      ok: false;
      code: "INVALID_RECEIPT";
      message: typeof TAX_CALCULATED_RECEIPT_OWNERSHIP_ERROR_MESSAGE;
      status: 403;
    };

const defaultDb = prisma as unknown as ReceiptOwnershipDatabase;

export async function validateTaxCalculatedReceiptOwnership(
  actor: Actor,
  events: ClientReceiptEvent[],
  db: ReceiptOwnershipDatabase = defaultDb,
): Promise<TaxCalculatedReceiptOwnershipResult> {
  const taxCalculatedIds = uniqueTaxCalculatedReceiptIds(events);
  if (taxCalculatedIds.length === 0) {
    return { ok: true };
  }

  const ownedCount = await db.snaptaxReceipt.count({
    where: {
      id: { in: taxCalculatedIds },
      ...receiptWhereForActor(actor),
    },
  });

  if (ownedCount === taxCalculatedIds.length) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "INVALID_RECEIPT",
    message: TAX_CALCULATED_RECEIPT_OWNERSHIP_ERROR_MESSAGE,
    status: 403,
  };
}
