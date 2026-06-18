import type { HomeWidgetsData } from "./computeHomeWidgets";

export type WidgetPageKey =
  | "deadline"
  | "missing"
  | "progress"
  | "cpa"
  | "needAction";

/** Tax season → CPA Ready; off-season with blurry receipts → Need Action. */
export function resolveFourthWidgetKey(
  data: HomeWidgetsData,
  blurryCount: number,
): WidgetPageKey | null {
  if (data.showCpaReady) return "cpa";
  if (blurryCount > 0) return "needAction";
  return null;
}

/** Visible widgets; deadline stays center when a page has three cards. */
export function buildWidgetPageKeys(
  data: HomeWidgetsData,
  blurryCount = 0,
): WidgetPageKey[] {
  const keys: WidgetPageKey[] = [];
  if (data.missing.missing.length > 0) {
    keys.push("missing");
  }
  keys.push("deadline");
  keys.push("progress");
  const fourth = resolveFourthWidgetKey(data, blurryCount);
  if (fourth) {
    keys.push(fourth);
  }
  return keys;
}

export function chunkPages<T>(keys: T[], maxPerPage = 3): T[][] {
  if (keys.length === 0) return [];
  const pages: T[][] = [];
  for (let i = 0; i < keys.length; i += maxPerPage) {
    pages.push(keys.slice(i, i + maxPerPage));
  }
  return pages;
}

export function buildWidgetPages(
  data: HomeWidgetsData,
  blurryCount = 0,
): WidgetPageKey[][] {
  return chunkPages(buildWidgetPageKeys(data, blurryCount));
}

export function pageColumnFlexClass(count: number): string {
  if (count <= 1) return "min-w-0 flex-[1_1_100%] basis-full";
  if (count === 2) return "min-w-0 flex-[1_1_50%] basis-1/2";
  return "min-w-0 flex-[1_1_33.333%] basis-1/3";
}
