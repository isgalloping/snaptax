# Onboarding Stage 1 — SNAP Focus Ring Heartbeat Amendment

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-snap-focus-ring-design.md`](./2026-06-14-onboarding-snap-focus-ring-design.md)

**Brainstorming approved:** 2026-06-14 — Remove marching stroke; heartbeat border (option C); extreme glow + scale pulse (option C); keep `SnapTooltip`.

---

## 1. Problem

The shipped focus ring uses border breathe + marching stroke (conic-gradient spin). Product feedback: marching is distracting; workers need a clearer **fade-in/fade-out border** with **stronger outer glow** to draw attention to SNAP, while keeping the existing tooltip copy.

---

## 2. Decisions

| Topic | Old (focus-ring spec) | New (this amendment) |
|-------|----------------------|----------------------|
| Marching stroke | conic-gradient 2s spin | **Removed** |
| Border animation | Simple breathe 1.2s | **Heartbeat double-beat** 1.2s (亮→暗→亮→长暗) |
| Outer glow | Peak ~22px | **Peak 40px** + dual-layer halo |
| Scale | None | **scale 1.0↔1.02** on overlay wrapper |
| `SnapTooltip` | Keep | **Unchanged** (no sync) |
| Colors | Yellow `#EAB308` | **Unchanged** |
| Lifecycle | `stage_1`, ends on SNAP | **Unchanged** |
| `prefers-reduced-motion` | Static ring | **Unchanged** |

---

## 3. Visual spec

### 3.1 Layers (single pulse layer)

Replace `snap-focus-ring__breathe` + `snap-focus-ring__marquee` with one class: `snap-focus-ring__pulse`.

| Property | Peak (bright) | Trough (dark) | Long dark |
|----------|---------------|---------------|-----------|
| Border opacity | 1.0 | 0.25 | 0.15 |
| `box-shadow` glow | `0 0 40px rgba(234,179,8,0.95), 0 0 16px rgba(250,204,21,0.6)` | `0 0 4px rgba(234,179,8,0.2)` | none |
| `transform: scale` | 1.02 | 1.0 | 1.0 |

### 3.2 Heartbeat keyframes (`snap-coach-heartbeat`, 1.2s, ease-in-out, infinite)

```css
@keyframes snap-coach-heartbeat {
  0% {
    opacity: 1;
    transform: scale(1.02);
    box-shadow:
      0 0 40px rgba(234, 179, 8, 0.95),
      0 0 16px rgba(250, 204, 21, 0.6);
  }
  15% {
    opacity: 0.25;
    transform: scale(1);
    box-shadow: 0 0 4px rgba(234, 179, 8, 0.2);
  }
  30% {
    opacity: 1;
    transform: scale(1.02);
    box-shadow:
      0 0 40px rgba(234, 179, 8, 0.95),
      0 0 16px rgba(250, 204, 21, 0.6);
  }
  50%,
  100% {
    opacity: 0.15;
    transform: scale(1);
    box-shadow: none;
  }
}
```

Apply to `snap-focus-ring__pulse` with `border: 3px solid #eab308`, `border-radius: inherit`, `transform-origin: center`.

**Note:** Overlay uses `pointer-events-none`; scale must not shift clickable area of underlying `SnapButton`.

### 3.3 Border ring appearance

Use solid yellow border on pulse layer (not replacing SnapButton white border). Button underneath remains unchanged.

### 3.4 `SnapTooltip`

No changes to component, copy, position, or animation.

### 3.5 `prefers-reduced-motion: reduce`

```css
.snap-focus-ring__pulse {
  animation: none !important;
}
.snap-focus-ring {
  box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.8);
}
```

Delete unused `snap-coach-marquee-spin` keyframes and `__marquee` rules.

---

## 4. Architecture

### 4.1 Component (`SnapFocusRing.tsx`)

```tsx
export function SnapFocusRing() {
  return (
    <div className={`${SNAP_FOCUS_RING_CLASS} pointer-events-none absolute inset-x-0 top-0 z-10 ... rounded-2xl`}>
      <div className="snap-focus-ring__pulse absolute inset-0 rounded-2xl" />
    </div>
  );
}
```

Remove `__breathe` and `__marquee` child divs.

### 4.2 Files to touch

| File | Change |
|------|--------|
| `app/globals.css` | Replace breathe/marquee with `snap-coach-heartbeat`; delete marquee keyframes |
| `components/onboarding/SnapFocusRing.tsx` | Single `__pulse` layer |
| `components/onboarding/SnapFocusRing.test.ts` | No change (class export unchanged) |
| Mount sites | No change |

---

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-N1 | No marching/conic-gradient stroke visible |
| AC-N2 | Border shows double-beat fade (bright→dark→bright→long dark) over 1.2s cycle |
| AC-N3 | Peak glow ≥40px yellow; scale pulses to 1.02 at bright phases |
| AC-N4 | `SnapTooltip` unchanged above button |
| AC-N5 | SNAP button styling unchanged; first tap works |
| AC-N6 | `stage_2`+ / `completed` — no overlay |
| AC-N7 | `prefers-reduced-motion` — static ring |

---

## 6. Out of scope

- Tooltip text or sync animation on stage_1 SNAP
- Stage 2 sandbox shutter — see [`2026-06-14-onboarding-sandbox-shutter-coach-design.md`](./2026-06-14-onboarding-sandbox-shutter-coach-design.md)
- Red border color
- Auto-dismiss timeout
