# Home Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the home screen to match `docs/ui/snaptax-home-ui.png` — fixed TaxHeader + Snap + TrustBar, scrollable Widget stack + receipt list, client-computed widget data, full-screen overlays for sub-flows; no PDF export.

**Architecture:** Pure compute functions in `lib/home/*` (unit-tested); presentational Widget/Overlay components; `HomeScreen` orchestrates `homeOverlay` viewState and pauses processing watcher when overlay open. Existing export/onboarding/camera flows unchanged.

**Tech Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · node:test + tsx

**Spec:** [`2026-06-17-home-dashboard-redesign-design.md`](../specs/2026-06-17-home-dashboard-redesign-design.md)

---

## File structure

| Path | Responsibility |
|------|----------------|
| `lib/home/industryDeductionHints.ts` | Industry → deduction hint definitions |
| `lib/home/computeTaxDeadline.ts` | US quarterly deadline + urgency + summary |
| `lib/home/computeMissingDeductions.ts` | Missing hints from receipts + industry |
| `lib/home/computeTaxYearProgress.ts` | Calendar progress + projected savings |
| `lib/home/computeHomeWidgets.ts` | Aggregates all widget DTOs |
| `lib/home/*.test.ts` | Unit tests for compute |
| `lib/ui/homeVisual.ts` | TrustBar + widget color tokens |
| `lib/i18n/types.ts` | New `home.trustBar` / `home.widgets` / `home.overlays` |
| `components/home/TrustBar.tsx` | Fixed privacy strip |
| `components/home/HomeScrollRegion.tsx` | Scroll container + filter ref |
| `components/home/widgets/WidgetStack.tsx` | Renders 4 widgets (conditional) |
| `components/home/widgets/*.tsx` | Individual widget cards |
| `components/home/overlays/OverlayShell.tsx` | Shared BACK header |
| `components/home/overlays/*.tsx` | Detail overlays |
| `components/home/HomeOverlayHost.tsx` | Switches on `HomeOverlay` enum |
| `components/home/TaxHeader.tsx` | Add filter icon |
| `components/home/ReceiptList.tsx` | Drop outer footer scroll cap; accept `filterBarRef` |
| `components/home/HomeScreen.tsx` | Shell recompose + overlay state |
| `docs/product/PRODUCT-SPEC.md` | §2.1 / §3 IA update |

---

### Task 1: Industry deduction hints

**Files:**
- Create: `lib/home/industryDeductionHints.ts`

- [ ] **Step 1: Create hint types and map**

```typescript
import type { Industry } from "@/lib/types";

export interface DeductionHint {
  id: string;
  label: string;
  categoryKeys: string[];
  defaultEstimate: number;
  whyItMatters: string;
}

const HINTS: Record<Industry, DeductionHint[]> = {
  truck_driver: [
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE", "PARKING"],
      defaultEstimate: 2000,
      whyItMatters:
        "Business miles and vehicle costs are among the largest deductions for drivers.",
    },
    {
      id: "phone_usage",
      label: "Phone Usage",
      categoryKeys: ["PHONE", "COMMUNICATION"],
      defaultEstimate: 600,
      whyItMatters: "A business-use share of your phone bill is deductible.",
    },
    {
      id: "safety_gear",
      label: "Safety Gear",
      categoryKeys: ["SAFETY", "EQUIPMENT", "SUPPLIES"],
      defaultEstimate: 400,
      whyItMatters: "Required PPE and safety equipment for the job site counts.",
    },
  ],
  construction: [
    {
      id: "tools_equipment",
      label: "Tools & Equipment",
      categoryKeys: ["TOOLS", "EQUIPMENT", "MATERIALS"],
      defaultEstimate: 1500,
      whyItMatters: "Job-site tools and gear are core Schedule C expenses.",
    },
    {
      id: "safety_gear",
      label: "Safety Gear",
      categoryKeys: ["SAFETY", "SUPPLIES", "EQUIPMENT"],
      defaultEstimate: 400,
      whyItMatters: "Hard hats, boots, and PPE add up over a tax year.",
    },
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE"],
      defaultEstimate: 1200,
      whyItMatters: "Travel between job sites is deductible business mileage.",
    },
  ],
  plumber: [
    {
      id: "tools_equipment",
      label: "Tools & Equipment",
      categoryKeys: ["TOOLS", "EQUIPMENT"],
      defaultEstimate: 1200,
      whyItMatters: "Specialty tools and parts are everyday business expenses.",
    },
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE"],
      defaultEstimate: 1000,
      whyItMatters: "Service calls and supply runs count as business driving.",
    },
    {
      id: "supplies",
      label: "Supplies",
      categoryKeys: ["SUPPLIES", "MATERIALS"],
      defaultEstimate: 800,
      whyItMatters: "Consumables used on jobs are deductible when documented.",
    },
  ],
  electrician: [
    {
      id: "tools_equipment",
      label: "Tools & Equipment",
      categoryKeys: ["TOOLS", "EQUIPMENT"],
      defaultEstimate: 1500,
      whyItMatters: "Meters, ladders, and power tools are deductible assets.",
    },
    {
      id: "safety_gear",
      label: "Safety Gear",
      categoryKeys: ["SAFETY", "SUPPLIES", "EQUIPMENT"],
      defaultEstimate: 350,
      whyItMatters: "Insulated gloves and safety gear protect you and your taxes.",
    },
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE"],
      defaultEstimate: 900,
      whyItMatters: "Driving to panels and job sites is business mileage.",
    },
  ],
  delivery: [
    {
      id: "vehicle_mileage",
      label: "Vehicle Mileage",
      categoryKeys: ["TRUCK GAS", "VEHICLE", "MILEAGE"],
      defaultEstimate: 2500,
      whyItMatters: "Delivery driving is your biggest deductible category.",
    },
    {
      id: "phone_usage",
      label: "Phone Usage",
      categoryKeys: ["PHONE", "COMMUNICATION"],
      defaultEstimate: 500,
      whyItMatters: "Dispatch and routing apps mean a deductible phone share.",
    },
    {
      id: "parking_tolls",
      label: "Parking & Tolls",
      categoryKeys: ["PARKING", "TOLLS", "OTHER"],
      defaultEstimate: 300,
      whyItMatters: "Parking and tolls on delivery runs add up quickly.",
    },
  ],
  general: [
    {
      id: "phone_usage",
      label: "Phone Usage",
      categoryKeys: ["PHONE", "COMMUNICATION"],
      defaultEstimate: 600,
      whyItMatters: "Business calls and data are partially deductible.",
    },
    {
      id: "home_office",
      label: "Home Office",
      categoryKeys: ["OFFICE", "SUPPLIES", "OTHER"],
      defaultEstimate: 800,
      whyItMatters: "A dedicated workspace may qualify for home office deductions.",
    },
    {
      id: "professional_services",
      label: "Professional Services",
      categoryKeys: ["OTHER", "SUPPLIES"],
      defaultEstimate: 500,
      whyItMatters: "Software, bookkeeping, and pro services are deductible.",
    },
  ],
};

export function hintsForIndustry(industry: Industry | null): DeductionHint[] {
  return HINTS[industry ?? "general"];
}

export function categoryMatchesHint(
  category: string | undefined,
  hint: DeductionHint,
): boolean {
  if (!category) return false;
  const normalized = category.toUpperCase().trim();
  return hint.categoryKeys.some(
    (key) => normalized.includes(key) || key.includes(normalized),
  );
}
```

---

### Task 2: Tax deadline compute (TDD)

**Files:**
- Create: `lib/home/computeTaxDeadline.test.ts`
- Create: `lib/home/computeTaxDeadline.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
  computeTaxDeadline,
  deadlineUrgency,
  nextEstimatedTaxDeadline,
} from "@/lib/home/computeTaxDeadline";

describe("computeTaxDeadline", () => {
  it("nextEstimatedTaxDeadline picks nearest future US date", () => {
    const now = new Date("2026-06-10T12:00:00.000Z");
    const next = nextEstimatedTaxDeadline(now, "UTC");
    assert.equal(next.getUTCMonth(), 5); // Jun = month 5 → Jun 15
    assert.equal(next.getUTCDate(), 15);
  });

  it("deadlineUrgency thresholds", () => {
    assert.equal(deadlineUrgency(31), "safe");
    assert.equal(deadlineUrgency(30), "attention");
    assert.equal(deadlineUrgency(14), "attention");
    assert.equal(deadlineUrgency(13), "urgent");
  });

  it("projected payment from deductions / 4", () => {
    const receipts: Receipt[] = [
      {
        id: "1",
        status: "done",
        amount: 1000,
        category: "TOOLS",
        deductible: true,
        timestamp: new Date("2026-03-01T12:00:00.000Z"),
      },
    ];
    const info = computeTaxDeadline(receipts, {
      now: new Date("2026-06-10T12:00:00.000Z"),
      timeZone: "UTC",
      marginalRate: 0.25,
    });
    assert.equal(info.projectedPayment, 62.5); // 1000 * 0.25 / 4
    assert.equal(info.expenses, 1000);
    assert.equal(info.income, 0);
    assert.equal(info.netProfit, -1000);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/home/computeTaxDeadline.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```typescript
import type { Receipt } from "@/lib/types";
import { receiptsInTaxYear, taxYearDeductions } from "@/lib/tax/taxYearStats";
import { clientTimeZone } from "@/lib/time/timeZone";

export type DeadlineUrgency = "safe" | "attention" | "urgent";

export interface TaxDeadlineInfo {
  quarterLabel: string;
  daysLeft: number;
  urgency: DeadlineUrgency;
  deadlineDate: Date;
  projectedPayment: number | null;
  income: number;
  expenses: number;
  netProfit: number;
}

/** US estimated tax due dates (month 1-indexed in helper below). */
const US_DEADLINES = [
  { month: 4, day: 15, quarter: "Q1" },
  { month: 6, day: 15, quarter: "Q2" },
  { month: 9, day: 15, quarter: "Q3" },
  { month: 1, day: 15, quarter: "Q4", yearOffset: 1 },
] as const;

function toUtcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
}

function adjustWeekend(date: Date): Date {
  const dow = date.getUTCDay();
  if (dow === 6) return new Date(date.getTime() + 2 * 86400000);
  if (dow === 0) return new Date(date.getTime() + 86400000);
  return date;
}

export function nextEstimatedTaxDeadline(
  now: Date,
  timeZone: string = clientTimeZone(),
): Date {
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now),
  );
  const candidates: Date[] = [];
  for (const d of US_DEADLINES) {
    const y = d.quarter === "Q4" ? year : year;
    const deadlineYear =
      d.quarter === "Q4" && d.month === 1 ? year + 1 : year;
    candidates.push(adjustWeekend(toUtcDate(deadlineYear, d.month, d.day)));
  }
  const future = candidates.filter((c) => c.getTime() > now.getTime());
  if (future.length > 0) {
    return future.sort((a, b) => a.getTime() - b.getTime())[0]!;
  }
  return adjustWeekend(toUtcDate(year + 1, 4, 15));
}

function quarterLabelForDate(deadline: Date): string {
  const m = deadline.getUTCMonth() + 1;
  if (m === 4) return "Q1 Estimated Tax";
  if (m === 6) return "Q2 Estimated Tax";
  if (m === 9) return "Q3 Estimated Tax";
  return "Q4 Estimated Tax";
}

export function deadlineUrgency(daysLeft: number): DeadlineUrgency {
  if (daysLeft > 30) return "safe";
  if (daysLeft >= 14) return "attention";
  return "urgent";
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

export function computeTaxDeadline(
  receipts: Receipt[],
  opts: {
    now?: Date;
    timeZone?: string;
    marginalRate?: number;
  } = {},
): TaxDeadlineInfo {
  const now = opts.now ?? new Date();
  const timeZone = opts.timeZone ?? clientTimeZone();
  const marginalRate = opts.marginalRate ?? 0.25;
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now),
  );
  const deadlineDate = nextEstimatedTaxDeadline(now, timeZone);
  const daysLeft = daysBetween(now, deadlineDate);
  const yearReceipts = receiptsInTaxYear(receipts, year, timeZone);
  const expenses = round2(
    yearReceipts.reduce((s, r) => s + (r.amount ?? 0), 0),
  );
  const income = 0;
  const netProfit = round2(income - expenses);
  const deductions = taxYearDeductions(receipts, year, timeZone);
  const projectedPayment =
    deductions > 0 ? round2((deductions * marginalRate) / 4) : null;

  return {
    quarterLabel: quarterLabelForDate(deadlineDate),
    daysLeft,
    urgency: deadlineUrgency(daysLeft),
    deadlineDate,
    projectedPayment,
    income,
    expenses,
    netProfit,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm run test:unit -- lib/home/computeTaxDeadline.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/home/industryDeductionHints.ts lib/home/computeTaxDeadline.ts lib/home/computeTaxDeadline.test.ts
git commit -m "feat(home): add tax deadline and industry hint compute helpers"
```

---

### Task 3: Missing deductions + tax year progress (TDD)

**Files:**
- Create: `lib/home/computeMissingDeductions.ts`
- Create: `lib/home/computeTaxYearProgress.ts`
- Create: `lib/home/computeMissingDeductions.test.ts`
- Create: `lib/home/computeTaxYearProgress.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// computeMissingDeductions.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import { computeMissingDeductions } from "@/lib/home/computeMissingDeductions";

describe("computeMissingDeductions", () => {
  it("returns missing hints when category not tracked", () => {
    const receipts: Receipt[] = [
      {
        id: "1",
        status: "done",
        category: "TOOLS",
        timestamp: new Date("2026-02-01T12:00:00.000Z"),
      },
    ];
    const result = computeMissingDeductions(receipts, "electrician", {
      now: new Date("2026-06-01T12:00:00.000Z"),
      timeZone: "UTC",
      marginalRate: 0.25,
    });
    assert.ok(result.missing.some((m) => m.label === "Vehicle Mileage"));
    assert.ok(!result.missing.some((m) => m.label === "Tools & Equipment"));
    assert.ok(result.totalTaxEstimate > 0);
  });

  it("empty missing when all hints tracked", () => {
    const receipts: Receipt[] = [
      {
        id: "1",
        status: "done",
        category: "TOOLS",
        timestamp: new Date("2026-02-01T12:00:00.000Z"),
      },
      {
        id: "2",
        status: "done",
        category: "SAFETY",
        timestamp: new Date("2026-03-01T12:00:00.000Z"),
      },
      {
        id: "3",
        status: "done",
        category: "TRUCK GAS",
        timestamp: new Date("2026-04-01T12:00:00.000Z"),
      },
    ];
    const result = computeMissingDeductions(receipts, "electrician", {
      now: new Date("2026-06-01T12:00:00.000Z"),
      timeZone: "UTC",
    });
    assert.equal(result.missing.length, 0);
  });
});
```

```typescript
// computeTaxYearProgress.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeTaxYearProgress } from "@/lib/home/computeTaxYearProgress";

describe("computeTaxYearProgress", () => {
  it("computes percent elapsed and projected savings", () => {
    const result = computeTaxYearProgress(100, {
      now: new Date("2026-07-01T12:00:00.000Z"),
      timeZone: "UTC",
    });
    assert.ok(result.progressPct > 0 && result.progressPct <= 100);
    assert.equal(result.year, 2026);
    assert.ok(result.projectedSavings != null && result.projectedSavings > 100);
  });

  it("null projected when taxSaved is 0", () => {
    const result = computeTaxYearProgress(0, {
      now: new Date("2026-07-01T12:00:00.000Z"),
      timeZone: "UTC",
    });
    assert.equal(result.projectedSavings, null);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm run test:unit -- lib/home/computeMissingDeductions.test.ts lib/home/computeTaxYearProgress.test.ts`

- [ ] **Step 3: Implement computeMissingDeductions.ts**

```typescript
import type { Industry, Receipt } from "@/lib/types";
import { receiptsInTaxYear } from "@/lib/tax/taxYearStats";
import { clientTimeZone } from "@/lib/time/timeZone";
import {
  categoryMatchesHint,
  hintsForIndustry,
  type DeductionHint,
} from "@/lib/home/industryDeductionHints";

export interface MissingDeductionItem {
  hint: DeductionHint;
  label: string;
  taxEstimate: number;
}

export interface MissingDeductionsResult {
  missing: MissingDeductionItem[];
  previewLabels: string[];
  totalTaxEstimate: number;
}

export function computeMissingDeductions(
  receipts: Receipt[],
  industry: Industry | null,
  opts: {
    now?: Date;
    timeZone?: string;
    marginalRate?: number;
  } = {},
): MissingDeductionsResult {
  const now = opts.now ?? new Date();
  const timeZone = opts.timeZone ?? clientTimeZone();
  const marginalRate = opts.marginalRate ?? 0.25;
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now),
  );
  const yearReceipts = receiptsInTaxYear(receipts, year, timeZone);
  const hints = hintsForIndustry(industry);
  const missing: MissingDeductionItem[] = [];

  for (const hint of hints) {
    const tracked = yearReceipts.some((r) =>
      categoryMatchesHint(r.category, hint),
    );
    if (!tracked) {
      missing.push({
        hint,
        label: hint.label,
        taxEstimate: round2(hint.defaultEstimate * marginalRate),
      });
    }
  }

  const totalTaxEstimate = round2(
    missing.reduce((s, m) => s + m.taxEstimate, 0),
  );

  return {
    missing,
    previewLabels: missing.slice(0, 3).map((m) => m.label),
    totalTaxEstimate,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 4: Implement computeTaxYearProgress.ts**

```typescript
import { clientTimeZone } from "@/lib/time/timeZone";

export interface TaxYearProgressResult {
  year: number;
  progressPct: number;
  projectedSavings: number | null;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dayOfYear(date: Date, timeZone: string): number {
  const start = new Date(
    Date.UTC(
      Number(
        new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(
          date,
        ),
      ),
      0,
      1,
    ),
  );
  return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
}

export function computeTaxYearProgress(
  taxSaved: number | null,
  opts: { now?: Date; timeZone?: string } = {},
): TaxYearProgressResult {
  const now = opts.now ?? new Date();
  const timeZone = opts.timeZone ?? clientTimeZone();
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now),
  );
  const totalDays = isLeapYear(year) ? 366 : 365;
  const elapsed = dayOfYear(now, timeZone);
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round((elapsed / totalDays) * 100)),
  );
  const saved = taxSaved ?? 0;
  const projectedSavings =
    saved > 0 && elapsed > 0
      ? round2(saved * (totalDays / elapsed))
      : null;

  return { year, progressPct, projectedSavings };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
```

- [ ] **Step 5: Create computeHomeWidgets.ts aggregator**

```typescript
import type { Industry, Receipt } from "@/lib/types";
import { countByStatus } from "@/lib/receipts/receiptStats";
import { computeTaxDeadline, type TaxDeadlineInfo } from "./computeTaxDeadline";
import {
  computeMissingDeductions,
  type MissingDeductionsResult,
} from "./computeMissingDeductions";
import {
  computeTaxYearProgress,
  type TaxYearProgressResult,
} from "./computeTaxYearProgress";

export interface HomeWidgetsData {
  deadline: TaxDeadlineInfo;
  missing: MissingDeductionsResult;
  progress: TaxYearProgressResult;
  cpaReadyCount: number;
}

export function computeHomeWidgets(
  receipts: Receipt[],
  taxSaved: number | null,
  industry: Industry | null,
  opts?: { now?: Date; timeZone?: string; marginalRate?: number },
): HomeWidgetsData {
  const counts = countByStatus(receipts);
  return {
    deadline: computeTaxDeadline(receipts, opts),
    missing: computeMissingDeductions(receipts, industry, opts),
    progress: computeTaxYearProgress(taxSaved, opts),
    cpaReadyCount: counts.done,
  };
}
```

- [ ] **Step 6: Run all lib/home tests — expect PASS**

Run: `npm run test:unit -- lib/home/`

- [ ] **Step 7: Commit**

```bash
git add lib/home/
git commit -m "feat(home): add missing deductions and tax year progress compute"
```

---

### Task 4: Visual tokens + i18n

**Files:**
- Modify: `lib/ui/homeVisual.ts`
- Modify: `lib/i18n/types.ts`
- Modify: `lib/i18n/locales/en-US.ts`
- Modify: `lib/i18n/locales/fr-FR.ts` (mirror keys with English fallback strings OK for MVP)
- Modify: `lib/i18n/locales/de-DE.ts`

- [ ] **Step 1: Add to `homeVisual.ts`**

```typescript
  trustBar: {
    bg: "#1A1A1A",
    border: "#2A2A2A",
    radius: "rounded-2xl",
  },
  widgets: {
    deadline: {
      bg: "bg-violet-950/80",
      border: "border-violet-700/60",
      accent: "text-violet-300",
    },
    missing: {
      bg: "bg-green-950/80",
      border: "border-green-700/60",
      accent: "text-green-300",
    },
    progress: {
      bg: "bg-blue-950/80",
      border: "border-blue-700/60",
      accent: "text-blue-300",
    },
    cpa: {
      bg: "bg-orange-950/80",
      border: "border-orange-700/60",
      accent: "text-orange-300",
    },
  },
```

- [ ] **Step 2: Extend `lib/i18n/types.ts` `home` block**

Add:

```typescript
    trustBar: {
      message: string;
      learnMore: string;
    };
    widgets: {
      deadline: {
        label: string;
        dueInDays: string;
        projectedPayment: string;
        viewDetails: string;
      };
      missing: {
        label: string;
        amountInDeductions: string;
        review: string;
      };
      progress: {
        label: string;
        percentComplete: string;
        projectedSavings: string;
      };
      cpa: {
        label: string;
        receiptsOrganized: string;
        export: string;
        subcopy: string;
      };
    };
    overlays: {
      back: string;
      gotIt: string;
      privacyTitle: string;
      privacyPoints: { title: string; body: string }[];
      deadlineTitle: string;
      daysLeft: string;
      income: string;
      expenses: string;
      netProfit: string;
      missingTitle: string;
      startTracking: string;
    };
```

- [ ] **Step 3: Add en-US strings** (match spec copy)

```typescript
      trustBar: {
        message:
          "Your receipts stay private. Never shared with IRS. Stored securely in the U.S.",
        learnMore: "Learn more",
      },
      widgets: {
        deadline: {
          label: "Next Tax Deadline",
          dueInDays: "Due in {days} Days",
          projectedPayment: "Projected Payment: {amount}",
          viewDetails: "View Details",
        },
        missing: {
          label: "You May Be Missing",
          amountInDeductions: "{amount} in deductions",
          review: "Review",
        },
        progress: {
          label: "{year} Tax Year",
          percentComplete: "{pct}% of this tax year completed",
          projectedSavings: "Projected Savings: {amount}",
        },
        cpa: {
          label: "CPA Ready",
          receiptsOrganized: "{count} receipts organized",
          export: "Export",
          subcopy: "Excel tax pack",
        },
      },
      overlays: {
        back: "< BACK",
        gotIt: "Got it",
        privacyTitle: "Your Privacy & Security",
        privacyPoints: [
          {
            title: "100% Private",
            body: "Only you can see your receipts. Never shared with the IRS or anyone else.",
          },
          {
            title: "Secure in the U.S.",
            body: "Your data is encrypted and stored in secure U.S. data centers.",
          },
          {
            title: "We Don't Sell Data",
            body: "No ads. No tracking. We never sell your information.",
          },
          {
            title: "You're in Control",
            body: "Delete your data anytime from Settings.",
          },
        ],
        deadlineTitle: "Deadline Details",
        daysLeft: "{days} Days Left",
        income: "Income",
        expenses: "Expenses",
        netProfit: "Net Profit",
        missingTitle: "Potential Deductions",
        startTracking: "Start Tracking",
      },
```

Also add `taxHeader.filterReceipts: "Filter receipts"` to `taxHeader` block.

- [ ] **Step 4: Mirror keys in fr-FR and de-DE** (English strings acceptable for MVP pass; `npm run test:unit -- lib/i18n` must pass)

- [ ] **Step 5: Run i18n test**

Run: `npm run test:unit -- lib/i18n/index.test.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/ui/homeVisual.ts lib/i18n/
git commit -m "feat(home): add widget visual tokens and i18n copy"
```

---

### Task 5: TrustBar component

**Files:**
- Create: `components/home/TrustBar.tsx`

- [ ] **Step 1: Implement TrustBar**

```tsx
"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { homeVisual } from "@/lib/ui/homeVisual";

interface TrustBarProps {
  onLearnMore: () => void;
}

export function TrustBar({ onLearnMore }: TrustBarProps) {
  const copy = useUserCopy().home.trustBar;
  const { trustBar } = homeVisual;

  return (
    <div className="shrink-0 px-4 pb-2">
      <div
        className={`flex items-center gap-3 ${trustBar.radius} border px-3 py-2.5`}
        style={{ backgroundColor: trustBar.bg, borderColor: trustBar.border }}
      >
        <span className="text-lg text-green-400" aria-hidden>
          🛡
        </span>
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-zinc-200">
          {copy.message}
        </p>
        <button
          type="button"
          onClick={onLearnMore}
          className="shrink-0 min-h-11 px-2 text-xs font-bold text-green-400 transition-transform active:scale-95"
        >
          {copy.learnMore} &gt;
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home/TrustBar.tsx
git commit -m "feat(home): add TrustBar component"
```

---

### Task 6: Widget cards + WidgetStack

**Files:**
- Create: `components/home/widgets/TaxDeadlineWidget.tsx`
- Create: `components/home/widgets/MissingDeductionsWidget.tsx`
- Create: `components/home/widgets/TaxYearProgressWidget.tsx`
- Create: `components/home/widgets/CpaReadyWidget.tsx`
- Create: `components/home/widgets/WidgetStack.tsx`

- [ ] **Step 1: Shared card shell pattern** — each widget file exports a card using `homeVisual.widgets.*` classes, `rounded-2xl border p-4`, label uppercase `text-[10px]`, hero `text-2xl font-black`, CTA as `button` with `active:scale-95`.

- [ ] **Step 2: TaxDeadlineWidget** — props: `data: TaxDeadlineInfo`, `onViewDetails`. Urgency maps to text color: safe=`text-green-400`, attention=`text-yellow-400`, urgent=`text-red-400`. Format projected payment with `formatCurrency` or `$—` when null.

- [ ] **Step 3: MissingDeductionsWidget** — return `null` when `missing.missing.length === 0`. Show preview labels as bullet list (max 3).

- [ ] **Step 4: TaxYearProgressWidget** — progress bar: outer `h-2 rounded-full bg-zinc-800`, inner `bg-blue-400` width `{progressPct}%`.

- [ ] **Step 5: CpaReadyWidget** — Export button calls `onExport`; show `subcopy` below button.

- [ ] **Step 6: WidgetStack**

```tsx
"use client";

import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import { TaxDeadlineWidget } from "./TaxDeadlineWidget";
import { MissingDeductionsWidget } from "./MissingDeductionsWidget";
import { TaxYearProgressWidget } from "./TaxYearProgressWidget";
import { CpaReadyWidget } from "./CpaReadyWidget";

interface WidgetStackProps {
  data: HomeWidgetsData;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onExport: () => void;
}

export function WidgetStack({
  data,
  onDeadlineDetails,
  onMissingReview,
  onExport,
}: WidgetStackProps) {
  return (
    <div className="flex flex-col gap-3 px-4 pt-3">
      <TaxDeadlineWidget data={data.deadline} onViewDetails={onDeadlineDetails} />
      <MissingDeductionsWidget
        data={data.missing}
        onReview={onMissingReview}
      />
      <TaxYearProgressWidget data={data.progress} />
      <CpaReadyWidget count={data.cpaReadyCount} onExport={onExport} />
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add components/home/widgets/
git commit -m "feat(home): add dashboard widget stack"
```

---

### Task 7: Overlay shell + overlay views

**Files:**
- Create: `components/home/overlays/OverlayShell.tsx`
- Create: `components/home/overlays/PrivacyTrustOverlay.tsx`
- Create: `components/home/overlays/DeadlineDetailOverlay.tsx`
- Create: `components/home/overlays/MissingDeductionsOverlay.tsx`
- Create: `components/home/overlays/MissingDeductionItemOverlay.tsx`
- Create: `components/home/overlays/HomeOverlayHost.tsx`

- [ ] **Step 1: OverlayShell** — copy Settings BACK button pattern:

```tsx
"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

interface OverlayShellProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function OverlayShell({ title, onBack, children, footer }: OverlayShellProps) {
  const back = useUserCopy().home.overlays.back;
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex shrink-0 items-center border-b-4 border-yellow-500 bg-zinc-900 p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider active:scale-95"
        >
          {back}
        </button>
        <h1 className="ml-4 text-lg font-black uppercase tracking-wider">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      {footer && <div className="shrink-0 border-t border-zinc-800 p-4">{footer}</div>}
    </div>
  );
}
```

- [ ] **Step 2: PrivacyTrustOverlay** — map `privacyPoints` to 4 icon rows; footer full-width yellow **Got it** calling `onClose`.

- [ ] **Step 3: DeadlineDetailOverlay** — circular countdown (`w-40 h-40 rounded-full border-4 flex items-center justify-center`), three summary rows with `formatCurrency`.

- [ ] **Step 4: MissingDeductionsOverlay** — list `missing.missing` items as tappable rows → `onSelectItem(hintId)`.

- [ ] **Step 5: MissingDeductionItemOverlay** — show `hint.whyItMatters`; **Start Tracking** calls `onStartTracking` (parent closes overlay + scrolls to snap).

- [ ] **Step 6: HomeOverlayHost**

```typescript
export type HomeOverlay =
  | null
  | "privacy-trust"
  | "deadline-detail"
  | "missing-deductions"
  | { type: "missing-deduction-item"; hintId: string };
```

Switch and render matching overlay; pass `widgetsData` and `industry` for missing flows.

- [ ] **Step 7: Commit**

```bash
git add components/home/overlays/ components/home/HomeOverlayHost.tsx
git commit -m "feat(home): add full-screen overlay flows"
```

---

### Task 8: HomeScrollRegion + ReceiptList filter ref

**Files:**
- Create: `components/home/HomeScrollRegion.tsx`
- Modify: `components/home/ReceiptList.tsx`

- [ ] **Step 1: HomeScrollRegion**

```tsx
"use client";

import { forwardRef, type ReactNode, type RefObject } from "react";

interface HomeScrollRegionProps {
  header: ReactNode;
  children: ReactNode;
}

export const HomeScrollRegion = forwardRef<HTMLDivElement, HomeScrollRegionProps>(
  function HomeScrollRegion({ header, children }, ref) {
    return (
      <div ref={ref} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {header}
        {children}
      </div>
    );
  },
);
```

- [ ] **Step 2: ReceiptList** — add optional `filterBarRef?: RefObject<HTMLDivElement | null>` forwarded to wrapper around `ReceiptFilterBar`. Change outer `<footer>` to `<div>` (scroll parent is now `HomeScrollRegion`). Keep inner list as `space-y-3` without nested `flex-1 overflow-y-auto` (single scroll container).

- [ ] **Step 3: ReceiptFilterBar** — reorder FILTERS array to `all, done, processing, blurry`; stuck pill unchanged (show when count > 0).

- [ ] **Step 4: Commit**

```bash
git add components/home/HomeScrollRegion.tsx components/home/ReceiptList.tsx components/home/ReceiptFilterBar.tsx
git commit -m "refactor(home): unified scroll region for widgets and receipts"
```

---

### Task 9: TaxHeader filter icon

**Files:**
- Modify: `components/home/TaxHeader.tsx`

- [ ] **Step 1: Add FilterIcon** (reuse existing icon pattern or add `components/icons/FilterIcon.tsx` simple funnel SVG)

- [ ] **Step 2: Add props**

```typescript
  onFilterClick?: () => void;
```

- [ ] **Step 3: Insert filter button between Sync and Settings** in action row; `aria-label` from `copy.filterReceipts`.

- [ ] **Step 4: Commit**

```bash
git add components/home/TaxHeader.tsx components/icons/FilterIcon.tsx lib/i18n/
git commit -m "feat(home): add header filter scroll-to action"
```

---

### Task 10: HomeScreen recompose

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: Add state**

```typescript
type HomeOverlay = /* from HomeOverlayHost */;
const [homeOverlay, setHomeOverlay] = useState<HomeOverlay>(null);
const scrollRef = useRef<HTMLDivElement>(null);
const filterBarRef = useRef<HTMLDivElement>(null);
```

- [ ] **Step 2: Compute widgets**

```typescript
const widgetsData = useMemo(
  () => computeHomeWidgets(displayReceipts, displayTaxSaved ?? taxSaved, industry),
  [displayReceipts, displayTaxSaved, taxSaved, industry],
);
```

- [ ] **Step 3: Restructure home JSX**

```tsx
<div className="relative flex h-full flex-col overflow-hidden bg-black ...">
  <TaxHeader ... onFilterClick={handleFilterClick} />
  <div className="shrink-0 px-4 py-2">
    {/* SnapButton + onboarding ring unchanged */}
  </div>
  <TrustBar onLearnMore={() => setHomeOverlay("privacy-trust")} />
  <HomeScrollRegion ref={scrollRef} header={
    <WidgetStack
      data={widgetsData}
      onDeadlineDetails={() => setHomeOverlay("deadline-detail")}
      onMissingReview={() => setHomeOverlay("missing-deductions")}
      onExport={handleExportClick}
    />
  }>
    <ReceiptList filterBarRef={filterBarRef} ... />
  </HomeScrollRegion>
  {homeOverlay && (
    <HomeOverlayHost
      overlay={homeOverlay}
      widgetsData={widgetsData}
      industry={industry}
      onClose={() => setHomeOverlay(null)}
      onNavigate={setHomeOverlay}
      onStartTracking={handleStartTracking}
    />
  )}
  {/* existing sheets, orchestrator, taxExport.overlays */}
</div>
```

- [ ] **Step 4: handleFilterClick**

```typescript
const handleFilterClick = useCallback(() => {
  filterBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  filterBarRef.current?.classList.add("ring-2", "ring-yellow-400");
  window.setTimeout(() => {
    filterBarRef.current?.classList.remove("ring-2", "ring-yellow-400");
  }, 1200);
}, []);
```

- [ ] **Step 5: handleStartTracking** — `setHomeOverlay(null)` then `scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })`.

- [ ] **Step 6: Pause watcher when overlay open**

Extend existing effect:

```typescript
const shouldPause =
  cameraOpen ||
  selectedReceipt != null ||
  view === "settings" ||
  appHidden ||
  homeOverlay != null;
```

- [ ] **Step 7: Commit**

```bash
git add components/home/HomeScreen.tsx
git commit -m "feat(home): wire dashboard shell, widgets, and overlays"
```

---

### Task 11: PRODUCT-SPEC update

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1: §2.1** — replace「禁止全局滚动」with「固定顶栏+快门+Trust Bar；Widget 与收据列表在同一内容区纵向滚动」

- [ ] **Step 2: §2.3.2** — add Trust Bar bullet under UI touchpoints (one-line privacy strip; Learn more → trust overlay)

- [ ] **Step 3: §3 IA** — update home tree:

```
主界面 (Home)
├── 固定：TaxHeader + Snap + TrustBar
├── 滚动区：Widget 栈（截止日 / 遗漏抵税 / 税年进度 / CPA Ready）+ 收据列表
└── Overlay（Home 内）：截止日详情 · 遗漏抵税 · Privacy Trust
```

- [ ] **Step 4: Commit**

```bash
git add docs/product/PRODUCT-SPEC.md
git commit -m "docs: update PRODUCT-SPEC for home dashboard layout"
```

---

### Task 12: Verification

- [ ] **Step 1: Unit tests**

Run: `npm run test:unit -- lib/home/`  
Expected: all PASS

- [ ] **Step 2: Lint touched files**

Run: `npm run lint`

- [ ] **Step 3: Manual smoke** (`npm run dev`)

| Check | Expected |
|-------|----------|
| 0 receipts | Widgets render `$—`; no crash |
| Fixed chrome | Header/Snap/Trust stay pinned while scrolling widgets+list |
| Learn more | Privacy overlay + Got it closes |
| View Details | Deadline overlay with countdown |
| Review | Missing list → item → Start Tracking scrolls up |
| CPA Export | Existing Google/Paddle gate |
| Filter icon | Scrolls to filter bar + highlight |
| Onboarding | Stage 1 focus ring still on Snap |

- [ ] **Step 4: Commit any fixups**

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Fixed Header + Snap + TrustBar | 5, 10 |
| Scroll widgets + list | 8, 10 |
| Trust Bar visual | 5 |
| Learn more privacy overlay | 7, 10 |
| Widget 1 deadline + colors | 2, 6 |
| Widget 2 missing (hide when empty) | 3, 6 |
| Widget 3 progress | 3, 6 |
| Widget 4 CPA Excel export | 6, 10 |
| Header filter icon | 9, 10 |
| Overlay viewStates | 7, 10 |
| No PDF | — (out of scope) |
| Client compute + tests | 1–3, 12 |
| PRODUCT-SPEC update | 11 |
| Watcher pause on overlay | 10 |
| Onboarding unchanged | 10 (no removal) |

**Placeholder scan:** None — all tasks have concrete paths and code.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-17-home-dashboard-redesign.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement task-by-task in this session with checkpoints

Which approach do you want?
