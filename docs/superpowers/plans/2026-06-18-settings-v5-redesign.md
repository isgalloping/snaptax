# Settings v5 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Settings main screen to v5 visual spec — outdoor-readable Summary, five-state Export card, v5 Share/Preferences styling — while preserving Header, Profile, Footer, viewState sub-pages, and export gates.

**Architecture:** Pure helpers (`filingDeadline`, `seasonExportState`, `resolveExportCardState`) drive Export card copy; four block components get visual refactors; `useTaxExportGate.onExported` marks season export done for P3/P4 state. `TaxExportSection` replaced by `TaxExportCard`.

**Tech Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · node:test + tsx

**Spec:** [`2026-06-18-settings-v5-redesign-design.md`](../specs/2026-06-18-settings-v5-redesign-design.md)

---

## File structure

| Path | Responsibility |
|------|----------------|
| `lib/settings/filingDeadline.ts` | Days until Apr 15; 7-day final window |
| `lib/settings/seasonExportState.ts` | localStorage per-season export-done flag |
| `lib/settings/resolveExportCardState.ts` | P0–P4 priority state machine |
| `lib/ui/settingsVisual.ts` | Summary semantic colors, export card, share tokens |
| `components/settings/TaxOverviewPanel.tsx` | v5 Summary layout |
| `components/settings/TaxExportCard.tsx` | v5 Export card UI + state-driven copy |
| `components/settings/ShareAppSection.tsx` | v5 avatars + share tiles; no Learn link |
| `components/settings/SettingsPreferencesList.tsx` | v5 grouped list with icons |
| `components/settings/SettingsScreen.tsx` | Wire `TaxExportCard`, pass export-done flag |
| `components/export/useTaxExportGate.tsx` | `markSeasonExportDone` on export success |
| `components/home/HomeScreen.tsx` | Refresh export-done tick for Settings |
| `lib/i18n/types.ts` + locales | Export card five-state strings |
| `docs/product/PRODUCT-SPEC.md` | §3 Settings v5 notes |

---

### Task 1: Filing deadline helper (TDD)

**Files:**
- Create: `lib/settings/filingDeadline.test.ts`
- Create: `lib/settings/filingDeadline.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysUntilFilingDeadline,
  isWithinFinalTaxPackWindow,
} from "@/lib/settings/filingDeadline";

describe("filingDeadline", () => {
  it("counts days until Apr 15 of season year", () => {
    const now = new Date("2027-04-10T12:00:00.000Z");
    assert.equal(daysUntilFilingDeadline("2027", now), 5);
  });

  it("returns negative after Apr 15", () => {
    const now = new Date("2027-04-16T12:00:00.000Z");
    assert.equal(daysUntilFilingDeadline("2027", now), -1);
  });

  it("final window is true when days left <= 7", () => {
    const now = new Date("2027-04-10T12:00:00.000Z");
    assert.equal(isWithinFinalTaxPackWindow("2027", now), true);
  });

  it("final window is false when days left > 7", () => {
    const now = new Date("2027-04-01T12:00:00.000Z");
    assert.equal(isWithinFinalTaxPackWindow("2027", now), false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/settings/filingDeadline.test.ts`

- [ ] **Step 3: Implement**

```typescript
const MS_PER_DAY = 86_400_000;

function filingDeadlineUtc(season: string): Date {
  const year = Number(season);
  return new Date(Date.UTC(year, 3, 15, 23, 59, 59));
}

export function daysUntilFilingDeadline(
  season: string,
  now: Date = new Date(),
): number {
  const deadline = filingDeadlineUtc(season);
  return Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY);
}

export function isWithinFinalTaxPackWindow(
  season: string,
  now: Date = new Date(),
): boolean {
  const days = daysUntilFilingDeadline(season, now);
  return days >= 0 && days <= 7;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm run test:unit -- lib/settings/filingDeadline.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/settings/filingDeadline.ts lib/settings/filingDeadline.test.ts
git commit -m "feat(settings): add filing deadline helpers for export card P0"
```

---

### Task 2: Season export state (TDD)

**Files:**
- Create: `lib/settings/seasonExportState.test.ts`
- Create: `lib/settings/seasonExportState.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  hasSeasonExportDone,
  markSeasonExportDone,
  clearSeasonExportDone,
  seasonExportStorageKey,
} from "@/lib/settings/seasonExportState";

describe("seasonExportState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("storage key is per season", () => {
    assert.equal(seasonExportStorageKey("2027"), "snap1099_tax_pack_exported_2027");
  });

  it("mark then has returns true", () => {
    markSeasonExportDone("2027");
    assert.equal(hasSeasonExportDone("2027"), true);
    assert.equal(hasSeasonExportDone("2028"), false);
  });

  it("clear removes flag", () => {
    markSeasonExportDone("2027");
    clearSeasonExportDone("2027");
    assert.equal(hasSeasonExportDone("2027"), false);
  });
});
```

Note: tests need `localStorage` mock if node env lacks it — follow pattern in `exportSampleState` tests if present; otherwise use minimal in-memory stub at top of test file.

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/settings/seasonExportState.test.ts`

- [ ] **Step 3: Implement**

```typescript
export function seasonExportStorageKey(season: string): string {
  return `snap1099_tax_pack_exported_${season}`;
}

export function hasSeasonExportDone(season: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(seasonExportStorageKey(season)) === "1";
}

export function markSeasonExportDone(season: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(seasonExportStorageKey(season), "1");
}

export function clearSeasonExportDone(season: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(seasonExportStorageKey(season));
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/settings/seasonExportState.ts lib/settings/seasonExportState.test.ts
git commit -m "feat(settings): track per-season tax pack export completion"
```

---

### Task 3: Export card state resolver (TDD)

**Files:**
- Create: `lib/settings/resolveExportCardState.test.ts`
- Create: `lib/settings/resolveExportCardState.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveExportCardState } from "@/lib/settings/resolveExportCardState";

const nearDeadline = new Date("2027-04-10T12:00:00.000Z");
const farFromDeadline = new Date("2027-03-01T12:00:00.000Z");

describe("resolveExportCardState", () => {
  it("P1 anonymous", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: false,
        seasonPaid: false,
        currentSeason: "2027",
        hasSeasonExportDone: false,
        now: farFromDeadline,
      }),
      "anon",
    );
  });

  it("P2 signed-in unpaid", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: false,
        currentSeason: "2027",
        hasSeasonExportDone: false,
        now: farFromDeadline,
      }),
      "unpaid",
    );
  });

  it("P3 paid not exported", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: true,
        currentSeason: "2027",
        hasSeasonExportDone: false,
        now: farFromDeadline,
      }),
      "paid_new",
    );
  });

  it("P4 paid exported", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: true,
        currentSeason: "2027",
        hasSeasonExportDone: true,
        now: farFromDeadline,
      }),
      "paid_exported",
    );
  });

  it("P0 overrides paid states within 7 days", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: true,
        currentSeason: "2027",
        hasSeasonExportDone: true,
        now: nearDeadline,
      }),
      "final_deadline",
    );
  });

  it("P0 does not apply to unpaid", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: false,
        currentSeason: "2027",
        hasSeasonExportDone: false,
        now: nearDeadline,
      }),
      "unpaid",
    );
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement**

```typescript
import { isWithinFinalTaxPackWindow } from "@/lib/settings/filingDeadline";

export type ExportCardState =
  | "final_deadline"
  | "anon"
  | "unpaid"
  | "paid_new"
  | "paid_exported";

export function resolveExportCardState(input: {
  isSignedIn: boolean;
  seasonPaid: boolean;
  currentSeason: string;
  hasSeasonExportDone: boolean;
  now?: Date;
}): ExportCardState {
  const now = input.now ?? new Date();
  if (
    input.isSignedIn &&
    input.seasonPaid &&
    isWithinFinalTaxPackWindow(input.currentSeason, now)
  ) {
    return "final_deadline";
  }
  if (!input.isSignedIn) return "anon";
  if (!input.seasonPaid) return "unpaid";
  if (!input.hasSeasonExportDone) return "paid_new";
  return "paid_exported";
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/settings/resolveExportCardState.ts lib/settings/resolveExportCardState.test.ts
git commit -m "feat(settings): resolve export card P0-P4 state"
```

---

### Task 4: settingsVisual tokens

**Files:**
- Modify: `lib/ui/settingsVisual.ts`

- [ ] **Step 1: Extend tokens**

```typescript
export const settingsVisual = {
  taxOverview: {
    container:
      "rounded-2xl border border-yellow-500/30 bg-zinc-900 shadow-[0_0_24px_rgba(234,179,8,0.08)]",
    valuePositive: "text-green-500",
    valueNeutral: "text-zinc-200",
    label: "text-[10px] font-bold uppercase text-zinc-400",
    value: "mt-1 text-2xl font-black sm:text-3xl",
  },
  exportCard: {
    container: "rounded-2xl border border-yellow-500/40 bg-zinc-900 p-4",
    subtitleCompat: "text-xs font-bold text-blue-400",
    subtitleFormat: "text-xs font-bold text-zinc-400",
    trustFootnote: "mt-3 text-xs font-bold text-zinc-500",
    badgePopular: "rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase text-white",
    price: "text-xl font-black text-yellow-500",
  },
  referralCard: "rounded-2xl border border-zinc-800 bg-zinc-900 p-4",
  shareTile:
    "rounded-xl bg-zinc-800 p-2 min-h-[4.5rem]",
  preferences: {
    container: "overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900",
    row: "flex min-h-[4.5rem] w-full items-center gap-3 px-4 py-3 text-left transition-transform active:scale-[0.99]",
    divider: "border-t border-zinc-800",
    notifPill: "rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-black text-white",
  },
} as const;
```

Remove obsolete `columnSaved` / `columnReceipts` / `columnDeductions` after TaxOverviewPanel migration.

- [ ] **Step 2: Commit**

```bash
git add lib/ui/settingsVisual.ts
git commit -m "style(settings): add v5 visual tokens for summary and export card"
```

---

### Task 5: i18n — Export card strings

**Files:**
- Modify: `lib/i18n/types.ts`
- Modify: `lib/i18n/locales/en-US.ts`
- Modify: `lib/i18n/locales/fr-FR.ts`
- Modify: `lib/i18n/locales/de-DE.ts`

- [ ] **Step 1: Add `settings.exportCard` to types**

```typescript
exportCard: {
  compatLine: string;
  formatLine: string;
  trustLine: string;
  mostPopular: string;
  price: string;
  states: {
    final_deadline: { title: string; cta: string };
    anon: { title: string; cta: string };
    unpaid: { title: string; cta: string };
    paid_new: { title: string; cta: string };
    paid_exported: { title: string; cta: string };
  };
};
```

Keep existing `settings.export` keys used by export engine / errors.

- [ ] **Step 2: en-US copy**

```typescript
exportCard: {
  compatLine: "TurboTax & H&R Block Compatible",
  formatLine: "IRS-ready Excel + CSV",
  trustLine: "Used by thousands of self-employed pros",
  mostPopular: "Most Popular",
  price: "$49",
  states: {
    final_deadline: {
      title: "Final Tax Pack Ready",
      cta: "Export Final Tax Pack",
    },
    anon: {
      title: "Unlock IRS Tax Pack",
      cta: "Preview Sample Export",
    },
    unpaid: {
      title: "Export {season} IRS Tax Pack",
      cta: "Unlock for $49",
    },
    paid_new: {
      title: "{season} IRS Tax Pack Unlocked",
      cta: "Download Tax Pack",
    },
    paid_exported: {
      title: "Tax Filing Ready",
      cta: "Export Again",
    },
  },
},
```

Add `settings.taxOverview.receiptsSnapped: "{count} Snapped"` for Summary column.

- [ ] **Step 3: fr-FR and de-DE** — translate same keys (follow existing locale tone).

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/types.ts lib/i18n/locales/en-US.ts lib/i18n/locales/fr-FR.ts lib/i18n/locales/de-DE.ts
git commit -m "i18n: add Settings v5 export card and summary strings"
```

---

### Task 6: TaxOverviewPanel v5

**Files:**
- Modify: `components/settings/TaxOverviewPanel.tsx`

- [ ] **Step 1: Update layout and semantic colors**

```tsx
function valueColor(active: boolean): string {
  return active
    ? settingsVisual.taxOverview.valuePositive
    : settingsVisual.taxOverview.valueNeutral;
}

// Per column:
// taxSaved: active when taxSaved !== null && taxSaved > 0
// receiptCount: active when receiptCount > 0
// totalDeductions: active when totalDeductions > 0

<p className={`${settingsVisual.taxOverview.value} ${valueColor(receiptCount > 0)}`}>
  {copy.receiptsSnapped.replace("{count}", String(receiptCount))}
</p>
```

Use `text-2xl sm:text-3xl font-black` from token. Labels: keep `copy.taxSaved`, shorten receipts label to `Receipts`, deductions to `Deductions` via i18n if needed.

- [ ] **Step 2: Manual smoke** — open Settings with 0 and >0 stats; verify green vs grey.

- [ ] **Step 3: Commit**

```bash
git add components/settings/TaxOverviewPanel.tsx
git commit -m "feat(settings): v5 summary panel with outdoor-readable numerals"
```

---

### Task 7: TaxExportCard component

**Files:**
- Create: `components/settings/TaxExportCard.tsx`

- [ ] **Step 1: Create component**

Props mirror old `TaxExportSection` plus:

```typescript
interface TaxExportCardProps {
  currentSeason: string;
  isSignedIn: boolean;
  seasonPaid: boolean;
  hasSeasonExportDone: boolean;
  exportBusy?: boolean;
  exportEmptyTip?: string | null;
  exportEmptyTipKey?: number;
  onExportEmptyTipDismiss?: () => void;
  onRequestExport: () => void;
}
```

Inside: `const state = resolveExportCardState({...})`; map `copy.settings.exportCard.states[state]` for title/cta; replace `{season}` in unpaid/paid_new titles.

Visual: lock SVG in yellow square (reuse from old TaxExportSection), show `$49` + Most Popular when `state === 'anon' || state === 'unpaid'`, hide for paid states. Full-width yellow CTA calls `onRequestExport` (SettingsScreen already branches ghost → sample-export vs gate).

Keep `ExportEmptyTip` above card when set.

- [ ] **Step 2: Commit**

```bash
git add components/settings/TaxExportCard.tsx
git commit -m "feat(settings): add v5 TaxExportCard with five-state copy"
```

---

### Task 8: Wire SettingsScreen; remove TaxExportSection

**Files:**
- Modify: `components/settings/SettingsScreen.tsx`
- Delete: `components/settings/TaxExportSection.tsx`

- [ ] **Step 1: Add props and state**

```typescript
import { TaxExportCard } from "@/components/settings/TaxExportCard";
import { hasSeasonExportDone } from "@/lib/settings/seasonExportState";

// New optional prop from HomeScreen:
seasonExportTick?: number;

const [exportDone, setExportDone] = useState(false);
useEffect(() => {
  setExportDone(hasSeasonExportDone(currentSeason));
}, [currentSeason, seasonExportTick]);
```

Replace `<TaxExportSection ... />` with:

```tsx
<TaxExportCard
  currentSeason={currentSeason}
  isSignedIn={isSignedIn}
  seasonPaid={seasonPaid}
  hasSeasonExportDone={exportDone}
  exportBusy={exportBusy}
  exportEmptyTip={exportEmptyTip}
  exportEmptyTipKey={exportEmptyTipKey}
  onExportEmptyTipDismiss={onExportEmptyTipDismiss}
  onRequestExport={handleExportRequest}
/>
```

- [ ] **Step 2: Delete `TaxExportSection.tsx`**; grep repo for imports — none should remain.

- [ ] **Step 3: Commit**

```bash
git add components/settings/SettingsScreen.tsx
git rm components/settings/TaxExportSection.tsx
git commit -m "feat(settings): wire TaxExportCard into SettingsScreen"
```

---

### Task 9: Mark season export on success

**Files:**
- Modify: `components/export/useTaxExportGate.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: In `useTaxExportGate`, import `markSeasonExportDone`**

```typescript
onExported={async () => {
  markSeasonExportDone(currentSeason);
  await refreshSeasonPaid?.();
  await onPostExportSync?.();
}}
```

- [ ] **Step 2: HomeScreen — bump tick after export**

Add `const [seasonExportTick, setSeasonExportTick] = useState(0)`; pass to `SettingsScreen`. In `onPostExportSync` callback passed to gate, add `setSeasonExportTick((t) => t + 1)`.

- [ ] **Step 3: Commit**

```bash
git add components/export/useTaxExportGate.tsx components/home/HomeScreen.tsx
git commit -m "feat(settings): persist export-done flag when tax pack exports"
```

---

### Task 10: ShareAppSection v5 (no Learn)

**Files:**
- Modify: `components/settings/ShareAppSection.tsx`
- Delete: `components/settings/ReferralLearnSheet.tsx`

- [ ] **Step 1: Remove** `learnOpen` state, `ReferralLearnSheet` import/render, top `copy.cta` headline, `copy.learnHow` button, `copy.footnote` if redundant.

- [ ] **Step 2: Layout**

```tsx
<section className={`mb-6 ${settingsVisual.referralCard}`}>
  <div className="mb-4 flex items-center gap-2">{/* avatars unchanged */}</div>
  <div className="grid grid-cols-3 gap-2">
    {/* share tiles with shareTile class min-h-[4.5rem] */}
  </div>
</section>
```

- [ ] **Step 3: Delete `ReferralLearnSheet.tsx`**

- [ ] **Step 4: Commit**

```bash
git add components/settings/ShareAppSection.tsx
git rm components/settings/ReferralLearnSheet.tsx
git commit -m "feat(settings): simplify share section to v5 layout without learn link"
```

---

### Task 11: SettingsPreferencesList v5

**Files:**
- Modify: `components/settings/SettingsPreferencesList.tsx`

- [ ] **Step 1: Grouped card with icons**

Replace separate bordered rows with single `settingsVisual.preferences.container` wrapper and `divide-y` or manual dividers.

Add inline SVG icons (globe blue, briefcase amber, bell yellow, shield purple) — keep simple 20×20 SVGs in file or small icon components.

Notification preview:

```tsx
<span className={settingsVisual.preferences.notifPill}>
  {listCopy.notificationsOn.replace("{count}", String(notifCount))}
</span>
```

Refresh notif count on return to main: optional `useEffect` on visibility or pass tick from SettingsScreen — minimum: re-read on mount (existing pattern).

- [ ] **Step 2: Commit**

```bash
git add components/settings/SettingsPreferencesList.tsx
git commit -m "feat(settings): v5 preferences list with icons and 72pt rows"
```

---

### Task 12: PRODUCT-SPEC update

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1: Update §3 Settings** — note v5 Summary, Export card five states, Share without Learn link, Preferences v5 styling. Link to `2026-06-18-settings-v5-redesign-design.md`.

- [ ] **Step 2: Commit**

```bash
git add docs/product/PRODUCT-SPEC.md
git commit -m "docs: update PRODUCT-SPEC for Settings v5"
```

---

### Task 13: Verification

- [ ] **Step 1: Unit tests**

Run: `npm run test:unit -- lib/settings/filingDeadline.test.ts lib/settings/seasonExportState.test.ts lib/settings/resolveExportCardState.test.ts`

Expected: all PASS

- [ ] **Step 2: Lint**

Run: `npm run lint`

- [ ] **Step 3: Manual checklist** (from spec § Testing)

1. Summary zero → grey; positive → green; `N Snapped`
2. Ghost → Preview Sample Export → sample-export flow
3. Unpaid → Unlock for $49 → Paywall; Maybe later → red banner
4. Paid never exported → Download Tax Pack → ExportEngine
5. After export → Tax Filing Ready / Export Again persists reload
6. Date mock Apr 10 2027 + paid → Final Tax Pack Ready
7. Share three buttons; no Learn link
8. Preferences icons + green notif pill
9. Header / account / sign-out unchanged

---

## Spec coverage (self-review)

| Spec section | Task |
|--------------|------|
| Summary v5 | Task 4, 5, 6 |
| Export five states + P0 7-day | Task 1, 2, 3, 5, 7, 8, 9 |
| Share no Learn | Task 10 |
| Preferences v5 | Task 4, 11 |
| Unchanged Header/Profile/Footer | No code changes |
| Export banners preserved | Task 8 (SettingsScreen untouched banner block) |
| Home Export unchanged | Task 9 only adds markSeasonExportDone |
