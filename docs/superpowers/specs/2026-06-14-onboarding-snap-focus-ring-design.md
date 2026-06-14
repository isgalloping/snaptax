# Onboarding Stage 1 — SNAP Focus Ring Design

**Date:** 2026-06-14  
**Status:** Approved  
**Scope:** `stage_1` first-screen photo-area guidance — animated overlay on SNAP button (border breathe + marching stroke). Does **not** change button styling.

**Amends:** [`2026-06-13-aha-moment-onboarding-design.md`](./2026-06-13-aha-moment-onboarding-design.md) §3.1 Stage 1 visual guidance.

**Brainstorming approved:** 2026-06-14 — Option A (`SnapFocusRing` wrapper); yellow brand colors (not red); animations end on SNAP tap.

---

## 1. Problem

Stage 1 onboarding shows a yellow `SnapTooltip` above the SNAP button, but the CTA itself has no motion cue. Blue-collar users in bright/noisy environments need a stronger, zero-reading-cost signal to tap SNAP without altering the core yellow button chrome.

**Goal:** Add **border breathing** + **marching stroke** as a non-interactive overlay on the SNAP button during `stage_1` only.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Implementation | **方案 A** — standalone `SnapFocusRing` wrapper, no `SnapButton` prop |
| Button styling | **Unchanged** — `bg-yellow-500`, `border-4 border-white` |
| Overlay colors | Product **yellow** `#EAB308` — not red (red reserved for blurry resnap) |
| Tooltip | **Keep** `SnapTooltip` |
| Demo receipt pulse | **Keep** existing yellow card glow |
| Lifecycle end | **On SNAP tap** → `stage_2`; no auto-timeout |
| Scroll behavior | Animation **persists** until SNAP tap |
| Reduced motion | Static yellow ring, no breathe/march |
| Stage 2 sandbox | **Out of scope** |

---

## 3. Visual spec

### 3.1 Target area

Wrap **SNAP button body only** (`rounded-2xl` yellow CTA). Exclude:

- Compliance footnote below button
- Receipt list / tabs

### 3.2 Animation layers (stacked, `pointer-events-none`)

| Layer | Effect | Parameters |
|-------|--------|------------|
| **Marching stroke** | Highlight segment travels clockwise along button perimeter | Color `#EAB308`; stroke 3px; ~2s per lap, `linear`, infinite |
| **Border breathe** | Outer glow pulses | `box-shadow` yellow glow; opacity 0.35↔0.9; 1.2s `ease-in-out`, infinite |

Both layers share the button's `rounded-2xl` corner radius (16px).

### 3.3 Z-index

```text
SnapTooltip     z-20  (above)
SnapFocusRing   z-10  (overlay, non-interactive)
SnapButton      z-0   (interactive)
```

### 3.4 `prefers-reduced-motion`

When `prefers-reduced-motion: reduce`:

- Disable `@keyframes` animations
- Show static `ring-2 ring-yellow-500/80` equivalent

---

## 4. Architecture

```text
HomeScreen / OfflineHomeShell
  └─ div.relative (existing stage_1 container)
       ├─ SnapTooltip          (unchanged)
       ├─ SnapFocusRing        (new, stage_1 only)
       └─ SnapButton           (unchanged)
```

### 4.1 New files

| File | Responsibility |
|------|----------------|
| `components/onboarding/SnapFocusRing.tsx` | Presentational overlay; `absolute inset-0`, matches parent `rounded-2xl` |
| `app/globals.css` (or `components/onboarding/onboarding.css`) | `@keyframes snap-coach-breathe`, `snap-coach-marquee` |

### 4.2 Mount condition

```tsx
{onboardingStatus === "stage_1" && <SnapFocusRing />}
```

Same condition as `SnapTooltip` in `HomeScreen.tsx` and `OfflineHomeShell.tsx`.

### 4.3 Technical approach (recommended CSS)

**Marching stroke:** pseudo-element with `conic-gradient` mask or `background: linear-gradient` on a 1px-inset ring, animated `background-position` / rotating gradient — must follow `rounded-2xl`.

**Border breathe:** outer wrapper `box-shadow` with animated opacity via keyframes.

Alternative (if CSS ring proves fragile): SVG `<rect rx="16">` with `stroke-dasharray` + `stroke-dashoffset` animation inside `SnapFocusRing`. Prefer pure CSS first; fall back to SVG only if corner alignment fails on target devices.

---

## 5. Lifecycle

| Event | Behavior |
|-------|----------|
| Enter `stage_1` | Animations start immediately (post Hero Let's Go or cold-start resume) |
| SNAP tap | `resolveSnapIntent` → `stage_2`; `SnapFocusRing` + `SnapTooltip` unmount |
| `stage_2`+ / `completed` | No focus ring |
| User scrolls list | Animations continue until SNAP tap |

No persistence flag — purely derived from `onboardingStatus`.

---

## 6. Relationship to existing onboarding

| Element | Action |
|---------|--------|
| `SnapTooltip` | Retain |
| Demo receipt `animate-pulse` + yellow shadow | Retain |
| `OnboardingOrchestrator` | No change |
| Stage 2 `SandboxCameraSheet` | No change (future work if needed) |

---

## 7. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-1 | Fresh `stage_1` user sees breathe + marching overlay on SNAP button; button colors unchanged |
| AC-2 | SNAP tap removes overlay immediately and opens sandbox (`stage_2`) |
| AC-3 | `stage_2`+, `completed`, and non-onboarding users never see overlay |
| AC-4 | `prefers-reduced-motion: reduce` → static ring, no motion |
| AC-5 | `OfflineHomeShell` matches `HomeScreen` |
| AC-6 | Overlay does not block SNAP clicks (`pointer-events-none`) |
| AC-7 | Compliance footnote not included in animated region |

---

## 8. Files to touch

| Area | Files |
|------|-------|
| New component | `components/onboarding/SnapFocusRing.tsx` |
| Styles | `app/globals.css` |
| Mount | `components/home/HomeScreen.tsx`, `components/home/OfflineHomeShell.tsx` |
| Docs (optional) | `docs/product/PRODUCT-SPEC.md` §12 one-line note |

**Out of scope:** i18n (no new strings), state machine, `SnapButton` internals.

---

## 9. Testing

| Type | Coverage |
|------|----------|
| Manual | AC-1–AC-7 on mobile viewport + desktop |
| Manual | Cold-start resume at `stage_1` shows ring |
| Manual | OS reduced-motion setting |
| Unit (optional) | `SnapFocusRing` renders with expected class names when mounted — low priority |

---

## 10. Out of scope

- Red border color (explicitly rejected)
- Stage 2 sandbox shutter highlight
- Auto-dismiss after timeout
- Changing `SnapTooltip` copy or layout
- Server-side onboarding state
