import type { HomeWidgetsData } from "./computeHomeWidgets";

export type WidgetPageKey =
  | "deadline"
  | "missing"
  | "progress"
  | "cpa"
  | "needAction";

/** Visible widgets; Need Action #2 and CPA #3 when ACTION + tax season. */
export function buildWidgetPageKeys(
  data: HomeWidgetsData,
  actionCount = 0,
): WidgetPageKey[] {
  const hasMissing = data.missing.missing.length > 0;
  const hasAction = actionCount > 0;
  const hasCpa = data.showCpaReady;
  const keys: WidgetPageKey[] = [];

  if (hasMissing) {
    keys.push("missing");
  }

  if (hasAction) {
    if (!hasMissing) {
      keys.push("deadline");
    }
    keys.push("needAction");
    if (hasCpa) {
      keys.push("cpa");
    }
    if (hasMissing) {
      keys.push("deadline", "progress");
    } else {
      keys.push("progress");
    }
  } else if (hasCpa) {
    keys.push("deadline", "progress", "cpa");
  } else {
    keys.push("deadline", "progress");
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
  actionCount = 0,
): WidgetPageKey[][] {
  return chunkPages(buildWidgetPageKeys(data, actionCount));
}

export function pageColumnFlexClass(count: number): string {
  if (count <= 1) return "min-w-0 flex-[1_1_100%] basis-full";
  if (count === 2) return "min-w-0 flex-[1_1_50%] basis-1/2";
  return "min-w-0 flex-[1_1_33.333%] basis-1/3";
}
