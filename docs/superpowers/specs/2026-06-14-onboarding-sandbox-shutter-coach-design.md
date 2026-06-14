# Onboarding Stage 2 — Sandbox Shutter Coach Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:**
- [`2026-06-13-aha-moment-onboarding-design.md`](./2026-06-13-aha-moment-onboarding-design.md) §5 Sandbox camera
- [`2026-06-14-onboarding-snap-focus-heartbeat-design.md`](./2026-06-14-onboarding-snap-focus-heartbeat-design.md) — extends heartbeat pattern to stage_2

**Brainstorming approved:** 2026-06-14 — Heartbeat + Tooltip (option B); identical animation params as stage_1 (option A); overlay approach (scheme A).

---

## 1. Problem

Stage 2 sandbox shows a static yellow shutter over the Builder Depot sample receipt. After stage_1 SNAP coaching, users may not notice they must tap the shutter to continue. Need the same **heartbeat border + extreme glow** cue plus a **visible tooltip**, without changing shutter chrome.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Animation | Reuse `snap-coach-heartbeat` + `.snap-focus-ring__pulse` from stage_1 |
| Shape | `rounded-full` overlay on 96×96 shutter |
| Glow / scale | Identical to stage_1 (40px peak, scale 1.02) |
| Tooltip | New `SandboxShutterTooltip` — mirrors `SnapTooltip` styling |
| Tooltip copy | i18n `onboarding.aha.sandboxTooltip` |
| Shutter button | **Unchanged** — overlay is non-interactive |
| Lifecycle | Visible only while `SandboxCameraSheet` mounted (`stage_2`) |
| CSS | No new keyframes in `globals.css` |

---

## 3. Visual spec

### 3.1 Shutter pulse overlay

Wrap existing shutter `<button>` (h-24 w-24) in `relative` container:

```tsx
<div className="relative h-24 w-24">
  <div
    className="snap-focus-ring__pulse pointer-events-none absolute inset-0 rounded-full"
    aria-hidden
  />
  <button ...>{/* unchanged */}</button>
</div>
```

Reuses `.snap-focus-ring__pulse` and `@keyframes snap-coach-heartbeat` from `app/globals.css`.

### 3.2 SandboxShutterTooltip

Mirror `SnapTooltip` layout:

- Position: `absolute bottom-full left-1/2 -translate-x-1/2 mb-3`
- Yellow border bubble + downward caret pointing at shutter
- `pointer-events-none`, `role="status"`
- z-index above pulse layer

**Copy (en-US):** `"Tap the shutter to snap your sample receipt."`

### 3.3 `prefers-reduced-motion`

Inherited from existing `.snap-focus-ring__pulse` media query — static ring on shutter overlay.

---

## 4. Architecture

```text
OnboardingOrchestrator (status === stage_2)
  └─ SandboxCameraSheet
       └─ footer (flex col, items-center, relative)
            ├─ SandboxShutterTooltip
            └─ relative h-24 w-24
                 ├─ pulse overlay (rounded-full)
                 └─ shutter button
```

### 4.1 New files

| File | Responsibility |
|------|----------------|
| `components/onboarding/SandboxShutterTooltip.tsx` | Tooltip bubble; reads `copy.onboarding.aha.sandboxTooltip` |

### 4.2 Modified files

| File | Change |
|------|--------|
| `components/onboarding/SandboxCameraSheet.tsx` | Mount tooltip + pulse wrapper |
| `lib/i18n/types.ts` | Add `sandboxTooltip: string` under `onboarding.aha` |
| `lib/i18n/locales/en-US.ts` | English string |
| `lib/i18n/locales/de-DE.ts` | German string |
| `lib/i18n/locales/fr-FR.ts` | French string |

**No changes:** `SnapFocusRing`, `globals.css`, state machine, `OnboardingOrchestrator` logic.

---

## 5. i18n strings

| Locale | `sandboxTooltip` |
|--------|------------------|
| en-US | Tap the shutter to snap your sample receipt. |
| de-DE | Tippen Sie auf den Auslöser, um Ihren Beispielbeleg zu fotografieren. |
| fr-FR | Appuyez sur l'obturateur pour photographier votre reçu d'exemple. |

---

## 6. Lifecycle

| Event | Behavior |
|-------|----------|
| Enter `stage_2` | Sheet opens; tooltip + pulse start immediately |
| Shutter tap | `onComplete` → demo done → `stage_3`; sheet unmounts |
| Cold resume at `stage_2` | Sheet reopens with coach UI |
| `stage_3`+ | No sandbox sheet |

---

## 7. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-S1 | `stage_2` shutter shows heartbeat pulse (double-beat, 40px glow, scale 1.02) |
| AC-S2 | Tooltip visible above shutter with localized copy |
| AC-S3 | Shutter button appearance unchanged; first tap triggers `onComplete` |
| AC-S4 | `stage_3`+ / completed — no sandbox coach UI |
| AC-S5 | `prefers-reduced-motion` — static yellow ring on shutter |
| AC-S6 | Animation timing matches stage_1 `SnapFocusRing` |

---

## 8. Out of scope

- FLASH DONE micro-animation (separate F2-2 item)
- Real camera / getUserMedia
- Tooltip on stage_1 SNAP (already exists)
- Shared `CoachPulseOverlay` abstraction
- Red accent colors
