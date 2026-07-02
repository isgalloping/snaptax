import { NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { founderPriceDefaultCentsFlag } from "@/flags/founder";
import { formatCurrency } from "@/lib/format";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { currentTaxSeason } from "@/lib/tax/season";

export const GET = withRequestLog("api.entitlement", async (_request, _context) => {
  try {
    const taxSeason = currentTaxSeason();
    const priceCents = await founderPriceDefaultCentsFlag();
    const priceLabel = formatCurrency(priceCents / 100);

    return NextResponse.json({
      priceCents,
      priceLabel,
      taxSeason,
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
