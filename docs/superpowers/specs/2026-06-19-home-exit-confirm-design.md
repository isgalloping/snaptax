# Home Exit Confirm — Design

**Date:** 2026-06-19  
**Status:** Approved (design)  
**Builds on:** `2026-06-19-app-navigation-history-design.md`  
**Scope:** On **Home main screen only**, confirm before leaving the PWA via edge swipe or system back when the next action would exit the app.

## Problem

Users on the Home main screen accidentally swipe from the screen edge or press the Android system back key and **leave the app** without intending to. There is no confirmation step at the root.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Scope | **A** — Home main only (`view=home`, no overlay, no blocking sheets) |
| UI | **Bottom Sheet** (not center Modal) — product Sheet exception |
| Swipe | **Edge-only** (~24px from left/right); ≥60px horizontal; avoids Widget pager conflict |
| System back | Intercept when **next `popstate` would exit** the app |
| First trap back | **No sheet** — still inside app (existing double-`home` trap) |
| Second back / edge swipe | Show exit confirm sheet |
| Buttons | **STAY** (primary) · **EXIT** (destructive outline or secondary) |
| Touch targets | ≥ **64px** height |

## Trigger conditions (all required)

```
view === "home"
&& homeOverlay == null
&& !cameraOpen && selectedReceipt == null && !paywallBlockingSheets…
&& (edgeSwipeValid || systemBackWouldExit)
```

**Excluded:** Settings, overlays, Widget horizontal scroll area (non-edge touches), receipt detail / camera sheets.

## Sheet copy (i18n)

| Key | en-US |
|-----|-------|
| Title | Leave Snap1099? |
| Body | Your receipts stay saved on this device. |
| Stay | Stay |
| Exit | Exit |

de/fr equivalents in locales.

## Interaction

```
┌─────────────────────────────┐
│ Leave Snap1099?             │
│ Your receipts stay saved…   │
│                             │
│ [ STAY ]      [ EXIT ]      │
└─────────────────────────────┘
```

| Action | Behavior |
|--------|----------|
| STAY / backdrop tap | Close sheet; `pushState({ snap1099: 'home' })` to restore trap if needed |
| EXIT | Allow leave: `history.back()` until stack exits; optional `window.close()` in standalone |

## Architecture

```
lib/client/useHomeExitGuard.ts    edge swipe + exit-boundary popstate
lib/client/homeExitGuard.ts       pure helpers (edge zone, wouldExit)
components/home/ExitConfirmSheet.tsx
HomeScreen.tsx                    guard enabled + sheet state
```

**Does not modify:** `useSwipeBack` on overlay/settings shells, WidgetPager, History push for sub-flows.

## Edge swipe rules

| Rule | Value |
|------|-------|
| Edge zone | `clientX ≤ 24` or `clientX ≥ innerWidth - 24` at `touchstart` |
| Threshold | `\|dx\| ≥ 60`, horizontal dominant (reuse ratio from `useSwipeBack`) |
| Direction | Left or right both trigger exit **confirm** (not immediate exit) |

## System back integration

1. Listen `popstate` in `useHomeExitGuard` when Home root active.
2. If decoded state still `home` (trap layer) → no sheet.
3. If pop would leave app (null / external) → `prevent` by immediate `pushState` trap + open sheet.
4. EXIT confirms → call `navigateBackScreen()` or repeated `history.back()`.

## Files

| Path | Action |
|------|--------|
| `lib/client/homeExitGuard.ts` | **New** — pure edge / exit detection |
| `lib/client/homeExitGuard.test.ts` | **New** — unit tests |
| `lib/client/useHomeExitGuard.ts` | **New** — hook |
| `components/home/ExitConfirmSheet.tsx` | **New** |
| `components/home/HomeScreen.tsx` | **Modify** — wire guard + sheet |
| `lib/i18n/types.ts` + locales | **Modify** — exit copy keys |

## Testing

### Unit

- Edge zone detection
- Non-edge touch → no trigger
- `wouldExitPopState` helper cases

### Manual

- Home main: edge swipe → sheet; STAY stays in app
- Home main: EXIT closes PWA / browser back
- Widget swipe (center) → no sheet
- Open privacy overlay → edge swipe → overlay back, not exit sheet
- Settings → back to Home → no exit sheet until true exit boundary

## Success criteria

- Accidental edge swipe on Home does not silently exit
- Widget pager unaffected
- Sub-flow navigation unchanged
- Bottom Sheet only (no center Modal)

## Out of scope

- Settings root exit confirm
- `beforeunload` browser dialog
- Exit undo / rate-us prompt
