# Settings Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure Settings per `docs/prd/settings.md` — account pressure/compact states, Tax Overview trio, prominent $49 export CTA, referral card UI, collapsed preferences; Ghost export downloads sample CSV without Google/Paywall.

**Architecture:** New block components (`SettingsAccountBlock`, `TaxOverviewPanel`); tax stats passed from `HomeScreen`; Settings-only export handler branches ghost → D-scheme sample CSV; signed-in export still uses `useTaxExportGate`. Sign out moves to footer.

**Tech Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · node:test + tsx

**Spec:** [`2026-06-17-settings-redesign-design.md`](../specs/2026-06-17-settings-redesign-design.md)

---

## File structure

| Path | Responsibility |
|------|----------------|
| `lib/user/displayInitials.ts` | Name/email → avatar initials (unit-tested) |
| `lib/ui/settingsVisual.ts` | Tax Overview black-gold tokens |
| `lib/i18n/types.ts` + locales | overview, referral CTA, notifications |
| `components/settings/SettingsAccountBlock.tsx` | Unsigned pressure / signed-in compact |
| `components/settings/TaxOverviewPanel.tsx` | Three-column stats panel |
| `components/settings/TaxExportSection.tsx` | Full-width CTA, no section title |
| `components/settings/ShareAppSection.tsx` | Grey referral card |
| `components/settings/SettingsPreferencesSection.tsx` | +Notification coming soon |
| `components/settings/SettingsScreen.tsx` | Block order, footer sign-out |
| `components/home/HomeScreen.tsx` | Pass tax stats + settings export handler |
| `docs/product/PRODUCT-SPEC.md` | §3 Settings IA |

---

### Task 1: Display initials helper (TDD)

**Files:**
- Create: `lib/user/displayInitials.test.ts`
- Create: `lib/user/displayInitials.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { displayInitials } from "@/lib/user/displayInitials";

describe("displayInitials", () => {
  it("uses first two name tokens", () => {
    assert.equal(displayInitials("John Contractor", "j@x.com"), "JC");
  });

  it("single name uses one letter", () => {
    assert.equal(displayInitials("Madonna", "m@x.com"), "M");
  });

  it("falls back to email when name empty", () => {
    assert.equal(displayInitials("", "john@example.com"), "J");
  });

  it("handles whitespace-only name", () => {
    assert.equal(displayInitials("   ", "ab@test.com"), "A");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/user/displayInitials.test.ts`

- [ ] **Step 3: Implement**

```typescript
export function displayInitials(name: string, email: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return (tokens[0]![0]! + tokens[1]![0]!).toUpperCase();
  }
  if (tokens.length === 1) {
    return tokens[0]![0]!.toUpperCase();
  }
  const fallback = email.trim()[0];
  return fallback ? fallback.toUpperCase() : "?";
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm run test:unit -- lib/user/displayInitials.test.ts`

---

### Task 2: Visual tokens + i18n

**Files:**
- Create: `lib/ui/settingsVisual.ts`
- Modify: `lib/i18n/types.ts`
- Modify: `lib/i18n/locales/en-US.ts`
- Modify: `lib/i18n/locales/fr-FR.ts`
- Modify: `lib/i18n/locales/de-DE.ts`

- [ ] **Step 1: Create settingsVisual.ts**

```typescript
export const settingsVisual = {
  taxOverview: {
    container:
      "rounded-2xl border border-yellow-500/30 bg-zinc-900 shadow-[0_0_24px_rgba(234,179,8,0.08)]",
    columnSaved: "text-green-400",
    columnReceipts: "text-blue-400",
    columnDeductions: "text-yellow-400",
  },
  referralCard: "rounded-2xl border border-zinc-800 bg-zinc-900 p-4",
  shareTile: "rounded-xl bg-zinc-800 p-2",
} as const;
```

- [ ] **Step 2: Extend `lib/i18n/types.ts` `settings` block**

Add:

```typescript
    taxOverview: {
      taxSaved: string;
      receiptsTracked: string;
      totalDeductions: string;
    };
    notifications: {
      title: string;
      comingSoon: string;
    };
```

Update `share` block — add/replace keys:

```typescript
    share: {
      cta: string;
      footnote: string;
      whatsapp: string;
      facebook: string;
      more: string;
      message: string;
      shareTitle: string;
      linkCopied: string;
      shareFailed: string;
    };
```

Remove usage of `share.title` and `share.hint` in components (keep keys optional or delete from types if fully replaced).

Update `export.buttonLocked` value in en-US to include lock prefix in string OR keep lock as SVG only — use:

```typescript
buttonLocked: "Export {season} IRS Tax Pack ($49)",
```

- [ ] **Step 3: en-US strings**

```typescript
      taxOverview: {
        taxSaved: "Est. Tax Saved",
        receiptsTracked: "Receipts Tracked",
        totalDeductions: "Total Deductions",
      },
      notifications: {
        title: "Notifications",
        comingSoon: "Coming soon",
      },
```

Update share:

```typescript
      share: {
        cta: "Tell a fellow 1099 contractor to get 1 Year Free",
        footnote: "Share with 3 friends — reward program coming soon",
        whatsapp: "WhatsApp",
        facebook: "Facebook",
        more: "More",
        message: "I use Snap1099 to snap receipts and export an IRS-ready tax pack. Try it:",
        shareTitle: "Snap1099 — Receipts to IRS tax pack",
        linkCopied: "Link copied",
        shareFailed: "Could not share. Link copied instead.",
      },
```

- [ ] **Step 4: Mirror keys in fr-FR and de-DE** (English OK for MVP)

- [ ] **Step 5: Run i18n test**

Run: `npm run test:unit -- lib/i18n/index.test.ts`  
Expected: PASS

---

### Task 3: SettingsAccountBlock

**Files:**
- Create: `components/settings/SettingsAccountBlock.tsx`

- [ ] **Step 1: Implement component**

Props:

```typescript
interface SettingsAccountBlockProps {
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  seasonLabel: string;
  authHydrated?: boolean;
  onSignIn: () => void;
}
```

**Unsigned** (`!googleUser && authHydrated`):
- No outer heavy card border; use `mb-6`
- `p className="text-base font-black text-yellow-400"` → `copy.notSignedIn`
- Yellow full-width button → `copy.googleCta`, `min-h-16`, `bg-yellow-500 text-black border-4 border-white`
- **Do not** render `backupHint` paragraph

**Signed-in**:
- `flex items-center gap-4 mb-6 transition-all duration-300`
- Avatar: `h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center text-lg font-black text-black`
- Initials via `displayInitials(googleUser.name, googleUser.email)`
- Name: `text-base font-black text-white`
- Paid line when `seasonPaid`: `text-sm font-bold text-yellow-400` → `{seasonLabel} {copy.taxSeasonPaid}`

**Loading** (`!authHydrated`): `min-h-[4.5rem] mb-6` skeleton

- [ ] **Step 2: Export from file; do not remove AccountStatusBlock** (may be unused elsewhere — grep first; if only Settings used it, keep file for now or delete if unused)

---

### Task 4: TaxOverviewPanel

**Files:**
- Create: `components/settings/TaxOverviewPanel.tsx`

- [ ] **Step 1: Implement**

```typescript
export interface SettingsTaxStats {
  taxSaved: number | null;
  receiptCount: number;
  totalDeductions: number;
}

interface TaxOverviewPanelProps extends SettingsTaxStats {}
```

- Container: `settingsVisual.taxOverview.container mb-4`
- Grid: `grid grid-cols-3 divide-x divide-zinc-700 py-4`
- Each column centered: label `text-[10px] font-bold uppercase text-zinc-400`, value with color class
- `taxSaved === null` → display `$—` (same as home TaxHeader)
- Use `formatCurrency` from `@/lib/format`

---

### Task 5: TaxExportSection refactor

**Files:**
- Modify: `components/settings/TaxExportSection.tsx`

- [ ] **Step 1: Remove `<h2>` section title entirely**

- [ ] **Step 2: Update button classes** — match spec: `border-4 border-white bg-yellow-500 text-black text-lg font-black uppercase`

- [ ] **Step 3: Label logic unchanged** — `buttonLocked.replace("{season}", currentSeason)`, lock SVG when unpaid

- [ ] **Step 4: Section wrapper** — `className="mb-6"` only, no title

---

### Task 6: ShareAppSection referral card

**Files:**
- Modify: `components/settings/ShareAppSection.tsx`

- [ ] **Step 1: Wrap in `settingsVisual.referralCard`**

- [ ] **Step 2: Replace title/hint with**

```tsx
<p className="mb-4 text-sm font-bold text-white">{copy.cta}</p>
```

- [ ] **Step 3: Share tiles** — use `settingsVisual.shareTile` + `border-0` (remove `border-2 border-zinc-600`)

- [ ] **Step 4: Footnote**

```tsx
<p className="mt-3 text-xs text-zinc-500">{copy.footnote}</p>
```

- [ ] **Step 5: Remove outer section title** (`share.title` h2)

---

### Task 7: SettingsPreferencesSection — Notification placeholder

**Files:**
- Modify: `components/settings/SettingsPreferencesSection.tsx`

- [ ] **Step 1: After Industry block, before Help, add**

```tsx
<div>
  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
    {copy.settings.notifications.title}
  </h3>
  <div className="flex min-h-14 items-center justify-between rounded-xl border-2 border-zinc-700 bg-zinc-800/50 px-4 opacity-60">
    <span className="text-sm font-bold text-zinc-400">
      {copy.settings.notifications.comingSoon}
    </span>
    <button
      type="button"
      disabled
      role="switch"
      aria-checked={false}
      className="relative h-8 w-14 rounded-full bg-zinc-700"
      aria-label={copy.settings.notifications.comingSoon}
    >
      <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-zinc-500" />
    </button>
  </div>
</div>
```

---

### Task 8: SettingsScreen recompose

**Files:**
- Modify: `components/settings/SettingsScreen.tsx`

- [ ] **Step 1: Add props**

```typescript
  taxStats: SettingsTaxStats;
  isSignedIn: boolean; // already exists
```

Remove Sign out handling from account block — keep `showSignOutConfirm` state and sheet in SettingsScreen.

- [ ] **Step 2: Reorder scroll body**

```tsx
<SettingsAccountBlock ... onSignIn={() => { clearError(); setGoogleSheet("soft"); }} />
<TaxOverviewPanel {...taxStats} />
<TaxExportSection ... onRequestExport={onRequestExport} />
<ShareAppSection />
<SettingsPreferencesSection ... />
{isSignedIn && onSignOut && (
  <button type="button" onClick={() => { setSignOutError(null); setShowSignOutConfirm(true); }}
    className="mt-2 mb-8 w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-900 py-3 text-sm font-black uppercase tracking-wider text-white active:scale-95">
    {copy.settings.account.signOut}
  </button>
)}
```

- [ ] **Step 3: Replace `AccountStatusBlock` import with `SettingsAccountBlock`**

- [ ] **Step 4: Verify soft Google Sheet + sign-out sheet unchanged**

---

### Task 9: HomeScreen tax stats + Settings export handler

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: Import**

```typescript
import { taxYearDeductions } from "@/lib/tax/taxYearStats";
import { clientTimeZone } from "@/lib/time/timeZone";
import type { SettingsTaxStats } from "@/components/settings/TaxOverviewPanel";
```

- [ ] **Step 2: Compute settingsTaxStats**

```typescript
const settingsTaxStats = useMemo((): SettingsTaxStats => {
  const year = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: clientTimeZone(),
      year: "numeric",
    }).format(new Date()),
  );
  return {
    taxSaved: displayTaxSaved ?? taxSaved,
    receiptCount: displayReceipts.length,
    totalDeductions: taxYearDeductions(displayReceipts, year, clientTimeZone()),
  };
}, [displayReceipts, displayTaxSaved, taxSaved]);
```

- [ ] **Step 3: Settings export handler**

```typescript
const handleSettingsExport = useCallback(() => {
  if (!auth.isSignedIn) {
    void (async () => {
      const demo = await ensureOnboardingDemoDone();
      downloadOnboardingSampleCsv(demo);
      if (onboardingStatus === "stage_3" || onboardingStatus === "stage_aha") {
        await completeAhaCoach();
      }
    })();
    return;
  }
  taxExport.requestExport();
}, [auth.isSignedIn, onboardingStatus, completeAhaCoach, taxExport]);
```

- [ ] **Step 4: Pass to SettingsScreen**

```tsx
<SettingsScreen
  taxStats={settingsTaxStats}
  onRequestExport={handleSettingsExport}
  ...
/>
```

- [ ] **Step 5: Confirm `handleExportClick` (Home) unchanged** — still uses onboarding branch + `taxExport.requestExport()` for signed-in; ghost on Home still goes through gate unless in aha stages

---

### Task 10: PRODUCT-SPEC update

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1: Update §3 Settings tree**

```
设置/导出 (Settings)
├── 账户区（未登录施压 / 已登录 Avatar+姓名+Paid）
├── 税务资产总览（Tax Saved · Receipts · Deductions）
├── 通栏 Export IRS Tax Pack ($49)（Ghost → 样例 CSV；已登录 → 现有门控）
├── Share & Referral（1 Year Free 文案 · 无后端）
├── Preferences ▾（Language · Industry · Notifications coming soon · Privacy）
└── Sign out（页底，仅已登录）
```

- [ ] **Step 2: Note Ghost Settings export fast-lane vs Home export gate**

---

### Task 11: Verification

- [ ] **Step 1: Unit tests**

Run: `npm run test:unit -- lib/user/displayInitials.test.ts lib/i18n/index.test.ts`  
Expected: PASS

- [ ] **Step 2: Lint touched files**

Run: `npm run lint`

- [ ] **Step 3: Manual smoke** (`npm run dev`)

| Check | Expected |
|-------|----------|
| Ghost → Settings → Export | Sample CSV downloads; no Google/Paywall |
| Signed-in unpaid → Export | Paywall sheet |
| Tax Overview | Matches home stats |
| Unsigned account | Yellow headline + Google CTA |
| Signed-in | Initials avatar + name; Sign out at bottom only |
| Share card | Grey card + "1 Year Free" CTA |
| Preferences | Collapsed; Notifications disabled |
| Home Export (ghost) | Unchanged (gate or aha sample if in onboarding) |

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Account unsigned pressure | 3, 8 |
| Account signed-in compact + avatar | 1, 3, 8 |
| Tax Overview panel | 2, 4, 8, 9 |
| Export CTA prominent, no title | 5, 8 |
| Ghost D-scheme export | 9 |
| Signed-in export gate | 9 |
| Share referral UI | 2, 6 |
| Notification coming soon | 2, 7 |
| Sign out footer | 8 |
| Home stats props | 9 |
| PRODUCT-SPEC | 10 |
| Preserved soft Google Sheet | 8 |

**Placeholder scan:** None.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-17-settings-redesign.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement task-by-task in this session with checkpoints

Which approach do you want?
