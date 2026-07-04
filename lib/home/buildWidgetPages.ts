import type { HomeWidgetsData } from "./computeHomeWidgets";

export type WidgetPageKey =
  | "founder"
  | "deadline"
  | "missing"
  | "progress"
  | "cpa"
  | "needAction";

export type BuildWidgetPageOptions = {
  showFounder?: boolean;
};

/** Product gate: set true to restore Find More Savings widget. */
export const SHOW_MISSING_DEDUCTIONS_WIDGET = false;

/** Visible widgets; Need Action #2 and CPA #3 when ACTION + tax season. */
export function buildWidgetPageKeys(
  data: HomeWidgetsData,
  actionCount = 0,
  options?: BuildWidgetPageOptions,
): WidgetPageKey[] {
  const effectiveHasMissing =
    SHOW_MISSING_DEDUCTIONS_WIDGET && data.missing.missing.length > 0;
  const hasAction = actionCount > 0;
  const hasCpa = data.showCpaReady;
  const keys: WidgetPageKey[] = [];

  if (options?.showFounder) {
    keys.push("founder");
  }

  if (effectiveHasMissing) {
    keys.push("missing");
  }

  if (hasAction) {
    if (!effectiveHasMissing) {
      keys.push("deadline");
    }
    keys.push("needAction");
    if (hasCpa) {
      keys.push("cpa");
    }
    if (effectiveHasMissing) {
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
  options?: BuildWidgetPageOptions,
): WidgetPageKey[][] {
  const keys = buildWidgetPageKeys(data, actionCount, options);
  if (options?.showFounder && keys[0] === "founder") {
    const rest = keys.slice(1);
    if (rest.length === 0) return [["founder"]];
    return [["founder"], ...chunkPages(rest)];
  }
  return chunkPages(keys);
}

export function pageColumnFlexClass(count: number): string {
  if (count <= 1) return "min-w-0 flex-[1_1_100%] basis-full";
  if (count === 2) return "min-w-0 flex-[1_1_50%] basis-1/2";
  return "min-w-0 flex-[1_1_33.333%] basis-1/3";
}
