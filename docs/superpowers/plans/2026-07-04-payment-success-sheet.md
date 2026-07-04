# Payment Success Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a two-phase bottom sheet after Paddle payment (Export + Founder) confirming success and enabling manual export when entitlement is ready.

**Architecture:** `runPaymentSuccessFlow` orchestrates poll + phase transitions; `PaymentSuccessSheet` is presentational; `HomeScreen` owns state and wires Export CTA to existing `useTaxExportGate` export path.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, node:test + tsx, i18n locales (en/fr/de).

**Spec:** `docs/superpowers/specs/2026-07-04-payment-success-sheet-design.md`

---

### Task 1: Types + orchestrator tests

**Files:**
- Create: `lib/billing/paymentSuccessTypes.ts`
- Create: `lib/billing/runPaymentSuccessFlow.ts`
- Create: `lib/billing/runPaymentSuccessFlow.test.ts`

- [ ] **Step 1: Add types**

```typescript
// lib/billing/paymentSuccessTypes.ts
export type PaymentSuccessVariant = "export" | "founder";
export type PaymentSuccessPhase = "confirming" | "ready" | "error";

export type PaymentSuccessState = {
  open: boolean;
  variant: PaymentSuccessVariant;
  phase: PaymentSuccessPhase;
  seasonLabel: string;
  founderNumber?: number | null;
};
```

- [ ] **Step 2: Write failing tests**

```typescript
// lib/billing/runPaymentSuccessFlow.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runPaymentSuccessFlow } from "./runPaymentSuccessFlow.ts";

describe("runPaymentSuccessFlow", () => {
  it("export: confirming then ready after poll", async () => {
    const phases: string[] = [];
    await runPaymentSuccessFlow({
      variant: "export",
      season: "2027",
      onPhaseChange: (p) => phases.push(p),
      pollEntitlementReady: async () => true,
      refreshSeasonPaid: async () => {},
    });
    assert.deepEqual(phases, ["ready"]);
  });

  it("export: error when poll returns false", async () => {
    const phases: string[] = [];
    await runPaymentSuccessFlow({
      variant: "export",
      season: "2027",
      onPhaseChange: (p) => phases.push(p),
      pollEntitlementReady: async () => false,
      refreshSeasonPaid: async () => {},
    });
    assert.deepEqual(phases, ["error"]);
  });

  it("founder: ready after finalize + founder number", async () => {
    const phases: string[] = [];
    let number: number | null | undefined;
    await runPaymentSuccessFlow({
      variant: "founder",
      season: "2027",
      onPhaseChange: (p) => phases.push(p),
      onFounderNumber: (n) => { number = n; },
      pollEntitlementReady: async () => true,
      refreshSeasonPaid: async () => {},
      waitForFounderActive: async () => true,
      fetchFounderNumber: async () => 3,
    });
    assert.deepEqual(phases, ["ready"]);
    assert.equal(number, 3);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `node --import tsx --test lib/billing/runPaymentSuccessFlow.test.ts`

- [ ] **Step 4: Implement orchestrator**

```typescript
// lib/billing/runPaymentSuccessFlow.ts
import type { PaymentSuccessPhase, PaymentSuccessVariant } from "./paymentSuccessTypes";

export async function runPaymentSuccessFlow(deps: {
  variant: PaymentSuccessVariant;
  season: string;
  onPhaseChange: (phase: PaymentSuccessPhase) => void;
  onFounderNumber?: (n: number | null) => void;
  pollEntitlementReady: (season: string, maxMs: number) => Promise<boolean>;
  refreshSeasonPaid: () => Promise<void>;
  waitForFounderActive?: () => Promise<boolean>;
  fetchFounderNumber?: () => Promise<number | null>;
  maxWaitMs?: number;
}): Promise<void> {
  const maxWaitMs = deps.maxWaitMs ?? 30_000;
  try {
    const ready = await deps.pollEntitlementReady(deps.season, maxWaitMs);
    if (!ready) {
      deps.onPhaseChange("error");
      return;
    }
    await deps.refreshSeasonPaid();
    if (deps.variant === "founder") {
      await deps.waitForFounderActive?.();
      const n = (await deps.fetchFounderNumber?.()) ?? null;
      deps.onFounderNumber?.(n);
    }
    deps.onPhaseChange("ready");
  } catch {
    deps.onPhaseChange("error");
  }
}
```

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add lib/billing/paymentSuccessTypes.ts lib/billing/runPaymentSuccessFlow.ts lib/billing/runPaymentSuccessFlow.test.ts
git commit -m "feat(billing): add payment success flow orchestrator"
```

---

### Task 2: i18n keys

**Files:**
- Modify: `lib/i18n/types.ts`
- Modify: `lib/i18n/locales/en-US.ts`, `fr-FR.ts`, `de-DE.ts`

- [ ] Add `paymentSuccess.export.*` and `paymentSuccess.founder.*` per spec §6
- [ ] Commit: `feat(i18n): payment success sheet copy`

---

### Task 3: PaymentSuccessSheet component

**Files:**
- Create: `components/billing/PaymentSuccessSheet.tsx`

- [ ] Bottom sheet UI with phases `confirming | ready | error`
- [ ] Props: `state`, `onClose`, `onDownloadTaxPack`, `onRetry`, `onGotIt`, `onNotNow`
- [ ] Match PaywallSheet visual tokens (yellow top border, zinc-900, min-h buttons)
- [ ] `useDialogEscape` for ✕
- [ ] Commit: `feat(ui): PaymentSuccessSheet component`

---

### Task 4: PaywallSheet — remove confirming phase

**Files:**
- Modify: `components/settings/PaywallSheet.tsx`

- [ ] Remove `PaywallPhase` `confirming` branch and related UI
- [ ] `onPaid` in paddle callback: only notify parent (no poll here)
- [ ] Parent receives payment complete via new callback prop `onPaymentComplete?: () => void`
- [ ] Commit: `refactor(paywall): delegate post-payment to success sheet`

---

### Task 5: useTaxExportGate wiring

**Files:**
- Modify: `components/export/useTaxExportGate.tsx`

- [ ] Add prop `onExportPaymentComplete?: () => void`
- [ ] PaywallSheet `onPaid` → `onSeasonPaid()` + `onExportPaymentComplete?.()` (no poll/auto-export)
- [ ] Expose `triggerExportAfterPayment: () => openExportAfterPrepare()` for HomeScreen CTA
- [ ] Commit: `refactor(export): split payment complete from export trigger`

---

### Task 6: FounderProgramSheet + HomeScreen integration

**Files:**
- Modify: `components/home/sheets/FounderProgramSheet.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] Founder `onPaid` → parent opens success sheet + runs `runPaymentSuccessFlow` with `variant: founder`
- [ ] HomeScreen state: `paymentSuccess: PaymentSuccessState | null`
- [ ] Handlers:
  - `openPaymentSuccess(variant, season)`
  - `handlePaymentSuccessClose` — set `open: false`
  - `handlePaymentSuccessRetry` — reset phase confirming, re-run flow
  - `handleDownloadTaxPack` — `taxExport.triggerExportAfterPayment()`
- [ ] Render `<PaymentSuccessSheet />` at HomeScreen root (visible in both home + settings views)
- [ ] `fetchFounderNumber` via `fetchFounderProgramClient`
- [ ] Commit: `feat(home): wire payment success sheet for export and founder`

---

### Task 7: Verify

- [ ] Run: `node --import tsx --test lib/billing/runPaymentSuccessFlow.test.ts`
- [ ] Run: `npm run test:unit` (note pre-existing failures OK if unrelated)
- [ ] Manual: Export pay → sheet confirming → ready → Download; Founder pay → Got it
- [ ] Commit any fixes; push branch; open PR
