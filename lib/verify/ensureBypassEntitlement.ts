import { prisma } from "@/lib/prisma";
import { currentTaxSeason } from "@/lib/tax/season";
import { utcNow } from "@/lib/time/utc";
import { bypassTransactionId } from "@/lib/verify/bypassTransactionId";

export async function ensureBypassEntitlement(
  userId: string,
  taxSeason: string = currentTaxSeason(),
): Promise<boolean> {
  const existing = await prisma.snaptaxSeasonEntitlement.findUnique({
    where: { userId_taxSeason: { userId, taxSeason } },
  });
  if (existing) return false;

  await prisma.snaptaxSeasonEntitlement.create({
    data: {
      userId,
      taxSeason,
      transactionId: bypassTransactionId(userId, taxSeason),
      paidAt: utcNow(),
      amount: 0,
      channelCode: "verify_bypass",
    },
  });
  return true;
}
