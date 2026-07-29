# Onboarding SNAP Focus Ring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-interactive animated overlay (border breathe + marching stroke) on the SNAP button during onboarding `stage_1`, without changing button styling.

**Architecture:** New presentational `SnapFocusRing` component positioned absolutely over the SNAP button area (matching `homeVisual.snap` height). CSS keyframes in `globals.css`. Mounted beside existing `SnapTooltip` in `HomeScreen` and `OfflineHomeShell` when `onboardingStatus === "stage_1"`.

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · CSS `@keyframes` · existing `homeVisual.snap` height tokens

**Spec:** [`docs/superpowers/specs/2026-06-14-onboarding-snap-focus-ring-design.md`](../specs/2026-06-14-onboarding-snap-focus-ring-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `app/globals.css` | `@keyframes snap-coach-breathe`, `snap-coach-marquee-spin`; `.snap-focus-ring*` classes; `prefers-reduced-motion` override |
| `components/onboarding/SnapFocusRing.tsx` | Presentational overlay; exports `SNAP_FOCUS_RING_CLASS` for tests |
| `components/onboarding/SnapFocusRing.test.ts` | Assert exported class constant (no DOM) |
| `components/home/HomeScreen.tsx` | Wrap `SnapButton` in `relative` container; mount `SnapFocusRing` |
| `components/home/OfflineHomeShell.tsx` | Same mount as `HomeScreen` |
| `docs/product/PRODUCT-SPEC.md` | §12 one-line note (optional) |

---

### Task 1: CSS animations

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add keyframes and focus-ring classes after `.animate-tax-bounce` block**

```css
/* --- Onboarding Stage 1 SNAP focus ring --- */

@keyframes snap-coach-breathe {
  0%,
  100% {
    opacity: 0.35;
    box-shadow: 0 0 8px rgba(234, 179, 8, 0.35);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 22px rgba(234, 179, 8, 0.9);
  }
}

@keyframes snap-coach-marquee-spin {
  to {
    transform: rotate(360deg);
  }
}

.snap-focus-ring__breathe {
  animation: snap-coach-breathe 1.2s ease-in-out infinite;
}

.snap-focus-ring__marquee::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 3px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 250deg,
    #eab308 285deg,
    #facc15 315deg,
    transparent 360deg
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  animation: snap-coach-marquee-spin 2s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .snap-focus-ring__breathe,
  .snap-focus-ring__marquee::before {
    animation: none !important;
  }

  .snap-focus-ring {
    box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.8);
  }
}
```

- [ ] **Step 2: Verify dev server compiles CSS**

Run: `npm run dev` (or `npx next build` if dev already running)

Expected: No CSS/syntax errors in terminal

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(onboarding): add SNAP focus ring CSS animations"
```

---

### Task 2: SnapFocusRing component

**Files:**
- Create: `components/onboarding/SnapFocusRing.tsx`
- Create: `components/onboarding/SnapFocusRing.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SNAP_FOCUS_RING_CLASS } from "./SnapFocusRing";

describe("SnapFocusRing", () => {
  it("exports root class for overlay styling", () => {
    assert.equal(SNAP_FOCUS_RING_CLASS, "snap-focus-ring");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- components/onboarding/SnapFocusRing.test.ts`

Expected: FAIL — module `./SnapFocusRing` not found

- [ ] **Step 3: Implement component**

```tsx
"use client";

import { homeVisual } from "@/lib/ui/homeVisual";

export const SNAP_FOCUS_RING_CLASS = "snap-focus-ring";

export function SnapFocusRing() {
  return (
    <div
      className={`${SNAP_FOCUS_RING_CLASS} pointer-events-none absolute inset-x-0 top-0 z-10 ${homeVisual.snap.height} ${homeVisual.snap.maxHeight} rounded-2xl`}
      aria-hidden
    >
      <div className="snap-focus-ring__breathe absolute inset-0 rounded-2xl" />
      <div className="snap-focus-ring__marquee absolute inset-0 rounded-2xl" />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- components/onboarding/SnapFocusRing.test.ts`

Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/onboarding/SnapFocusRing.tsx components/onboarding/SnapFocusRing.test.ts
git commit -m "feat(onboarding): add SnapFocusRing overlay component"
```

---

### Task 3: Mount in HomeScreen

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: Add import**

```typescript
import { SnapFocusRing } from "@/components/onboarding/SnapFocusRing";
```

(Place next to existing `SnapTooltip` import.)

- [ ] **Step 2: Wrap SnapButton and mount focus ring**

Find the existing block (~line 852):

```tsx
<div className="relative shrink-0 px-4 py-2">
  {onboardingStatus === "stage_1" && <SnapTooltip />}
  <SnapButton
```

Replace with:

```tsx
<div className="relative shrink-0 px-4 py-2">
  {onboardingStatus === "stage_1" && <SnapTooltip />}
  <div className="relative w-full">
    {onboardingStatus === "stage_1" && <SnapFocusRing />}
    <SnapButton
```

Close the new wrapper `</div>` immediately after the `</SnapButton>` closing tag (before the outer `</div>`).

Resulting structure:

```tsx
<div className="relative shrink-0 px-4 py-2">
  {onboardingStatus === "stage_1" && <SnapTooltip />}
  <div className="relative w-full">
    {onboardingStatus === "stage_1" && <SnapFocusRing />}
    <SnapButton
      ref={snapButtonRef}
      onCapture={handleCapture}
      onBatchShot={handleBatchShot}
      onBatchDone={handleBatchDone}
      onBatchClose={handleBatchClose}
      onReviewDelete={handleReviewDelete}
      resnapId={resnapId}
      onCameraOpenChange={setCameraOpen}
      onSyncClick={handleManualListSync}
      onSettingsClick={() => setView("settings")}
      syncing={listSyncing}
      syncDisabled={!isOnline}
      onSnapIntent={handleSnapIntent}
    />
  </div>
</div>
```

**Why `relative w-full` wrapper:** `SnapFocusRing` is `absolute top-0` with `homeVisual.snap.height` — aligns to button only; `ComplianceFootnote` inside `SnapButton` sits below and is excluded (AC-7).

- [ ] **Step 3: Run lint on touched file**

Run: `npm run lint -- --max-warnings=0 components/home/HomeScreen.tsx`

Expected: No new errors from this change (pre-existing warnings elsewhere are OK)

- [ ] **Step 4: Commit**

```bash
git add components/home/HomeScreen.tsx
git commit -m "feat(onboarding): mount SnapFocusRing on HomeScreen stage_1"
```

---

### Task 4: Mount in OfflineHomeShell

**Files:**
- Modify: `components/home/OfflineHomeShell.tsx`

- [ ] **Step 1: Add import**

```typescript
import { SnapFocusRing } from "@/components/onboarding/SnapFocusRing";
```

- [ ] **Step 2: Apply same wrapper pattern (~line 144)**

Replace:

```tsx
<div className="relative shrink-0 px-4 py-2">
  {onboardingStatus === "stage_1" && <SnapTooltip />}
  <SnapButton
```

With:

```tsx
<div className="relative shrink-0 px-4 py-2">
  {onboardingStatus === "stage_1" && <SnapTooltip />}
  <div className="relative w-full">
    {onboardingStatus === "stage_1" && <SnapFocusRing />}
    <SnapButton
```

And close `</div>` after `</SnapButton>`.

- [ ] **Step 3: Commit**

```bash
git add components/home/OfflineHomeShell.tsx
git commit -m "feat(onboarding): mount SnapFocusRing on OfflineHomeShell stage_1"
```

---

### Task 5: Verification

**Files:** None (manual + unit)

- [ ] **Step 1: Run full unit suite**

Run: `npm run test:unit`

Expected: All tests pass (including new `SnapFocusRing.test.ts`)

- [ ] **Step 2: Manual AC checklist — stage_1 fresh user**

Prereq: Clear site data / IndexedDB so `onboarding_status` is `not_started`, complete Hero Let's Go → `stage_1`.

| AC | Check |
|----|-------|
| AC-1 | Yellow SNAP button unchanged; yellow breathe glow + marching stroke visible on button perimeter |
| AC-2 | Tap SNAP → overlay + tooltip gone; sandbox sheet opens (`stage_2`) |
| AC-6 | Tap SNAP works on first tap (overlay not blocking) |
| AC-7 | Compliance footnote below button has no animation |

- [ ] **Step 3: Manual — non-stage_1**

Complete onboarding or set `onboarding_status` to `completed` in DevTools → reload → no focus ring (AC-3).

- [ ] **Step 4: Manual — reduced motion**

Enable OS "Reduce motion" → reload at `stage_1` → static yellow ring, no spin/pulse (AC-4).

- [ ] **Step 5: Manual — OfflineHomeShell path**

Throttle network offline before Hero CTA; verify same ring at `stage_1` (AC-5).

---

### Task 6: Docs touch (optional)

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1: Update §12 onboarding row**

Change:

```markdown
| 蓝领新人引导（Welcome Landing + Coach） | ✅ | ✅（Landing + SnapCoach + FirstReceiptCoach） |
```

To:

```markdown
| 蓝领新人引导（Aha onboarding） | ✅ | ✅（Hero Stage 0 + shadow/sandbox/Aha + Stage 1 SNAP focus ring） |
```

- [ ] **Step 2: Commit**

```bash
git add docs/product/PRODUCT-SPEC.md
git commit -m "docs: update PRODUCT-SPEC onboarding implementation note"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| AC-1 breathe + march overlay | Task 1, 2 |
| AC-2 ends on SNAP tap | Task 3, 4 (status-driven unmount) |
| AC-3 not shown stage_2+ | Task 3, 4 mount condition |
| AC-4 reduced motion | Task 1 CSS media query |
| AC-5 OfflineHomeShell parity | Task 4 |
| AC-6 pointer-events-none | Task 2 component |
| AC-7 exclude footnote | Task 3 wrapper + height tokens |
| Keep SnapTooltip | Unchanged |
| No SnapButton prop | Task 2 standalone component |
| Yellow not red | Task 1 `#eab308` |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-14-onboarding-snap-focus-ring.md`.
