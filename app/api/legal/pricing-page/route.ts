import { NextResponse } from "next/server";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";
import { loadPricingPageLiveData } from "@/lib/legal/pricingPageData";

export async function GET() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("pricing.md"));
  let live = null;
  try {
    live = await loadPricingPageLiveData();
  } catch {
    live = null;
  }
  return NextResponse.json({ doc, live });
}
