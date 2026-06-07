import {
  REGION_CANDIDATE_STORAGE_KEY,
} from "@/lib/storage/clearLocalData";
import type { TaxRegion } from "@/lib/tax/types";

const EU_LANGS = new Set([
  "de", "fr", "it", "es", "nl", "pl", "pt", "sv", "da", "fi", "el", "cs",
  "ro", "hu", "sk", "bg", "hr", "sl", "et", "lv", "lt", "mt", "ga",
]);

export function inferTaxRegionCandidate(): TaxRegion {
  if (typeof navigator === "undefined") return "us";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of langs) {
    const base = tag.split("-")[0]?.toLowerCase();
    if (base && EU_LANGS.has(base)) return "eu";
  }
  return "us";
}

export function ensureTaxRegionCandidate(): TaxRegion {
  if (typeof localStorage === "undefined") return "us";
  const existing = localStorage.getItem(REGION_CANDIDATE_STORAGE_KEY);
  if (existing === "eu" || existing === "us") return existing;
  const region = inferTaxRegionCandidate();
  localStorage.setItem(REGION_CANDIDATE_STORAGE_KEY, region);
  return region;
}

export function taxRegionHeaders(): Record<string, string> {
  const region = ensureTaxRegionCandidate();
  return { "X-Tax-Region": region };
}
