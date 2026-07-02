import { NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { founderPriceDefaultFlag } from "@/flags/founder";
import { founderPriceUsdToCents } from "@/lib/founder/pricing";
import { formatCurrency } from "@/lib/format";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { currentTaxSeason } from "@/lib/tax/season";

export const GET = withRequestLog("api.entitlement", async (_request, _context) => {
  try {
    const taxSeason = currentTaxSeason();
    const priceUsd = await founderPriceDefaultFlag();
    const priceCents = founderPriceUsdToCents(priceUsd);
    const priceLabel = formatCurrency(priceUsd);

    return NextResponse.json({
      priceUsd,
      priceCents,
      priceLabel,
      taxSeason,
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
