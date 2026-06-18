import type { HomeWidgetsData } from "./computeHomeWidgets";

export type WidgetPageKey = "deadline" | "missing" | "progress" | "cpa";

export function buildWidgetPageKeys(data: HomeWidgetsData): WidgetPageKey[] {
  const keys: WidgetPageKey[] = ["deadline"];
  if (data.missing.missing.length > 0) {
    keys.push("missing");
  }
  keys.push("progress");
  if (data.showCpaReady) {
    keys.push("cpa");
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

export function buildWidgetPages(data: HomeWidgetsData): WidgetPageKey[][] {
  return chunkPages(buildWidgetPageKeys(data));
}

export function pageColumnFlexClass(count: number): string {
  if (count <= 1) return "min-w-0 flex-[1_1_100%] basis-full";
  if (count === 2) return "min-w-0 flex-[1_1_50%] basis-1/2";
  return "min-w-0 flex-[1_1_33.333%] basis-1/3";
}
