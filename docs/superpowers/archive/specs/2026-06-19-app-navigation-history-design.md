# App Navigation History Sync — Design

**Date:** 2026-06-19  
**Status:** Approved (design)  
**Builds on:** `2026-06-18-swipe-back-navigation-design.md`  
**Supersedes:** Swipe-back-only approach (direct `onBack` without History API)  
**Scope:** Sync in-app sub-flow navigation with browser History so swipe / Android system back return one level instead of exiting the PWA.

## Problem

Users inside full-screen sub-flows (Home overlays, Settings sub-pages) swipe left/right or use the system back gesture and **the entire app exits** instead of returning one level (e.g. Language → Settings main, privacy overlay → Home).

**Root cause:** Sub-flows use React state only (`homeOverlay`, `viewState`). Browser history typically has a single entry (`/`). System edge gestures call `history.back()`, which closes the PWA.

The existing `useSwipeBack` hook (Shell layer) cannot reliably win against OS/browser edge gestures and does not integrate with system back.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Approach | **History sync bridge** — `pushState` on forward, `popstate` on back |
| Back actions | BACK button, swipe, Android system back all call **`navigateBack()` → `history.back()`** |
| Root trap | Double `home` state on bootstrap; first back at root does **not** exit |
| Second back at root | **Allow exit** (standard PWA behavior after trap consumed) |
| Settings root back | `settings:main` back → Home (`view=home`) |
| Sheets / camera / paywall | **Out of scope** — dismiss only, no History entries |
| Widget pager | Unchanged — horizontal paging only |
| Anti-loop | `navigatingRef` guard; dedupe push by state key; bounded graph (max ~3 levels) |

## Navigation state graph

```
home (root + trap)
├── overlay:privacy-trust | deadline-detail | tax-year-detail | missing-deductions
│     └── overlay:missing-deduction-item:{hintId}
└── settings (view=settings)
      ├── settings:main
      └── settings:language | industry | notifications | privacy-center
            | sample-export | export-completed
```

### popstate → React mapping

| History key (`snap1099`) | React action |
|--------------------------|--------------|
| `home` | `setHomeOverlay(null)`; `setView("home")` |
| `overlay:*` | `setHomeOverlay(...)` per id |
| `settings` | `setView("settings")`; `setViewState("main")` |
| `settings:*` | `setView("settings")`; `setViewState(...)` |

Forward navigation pushes a new key; `navigateBack()` always calls `history.back()` and lets `popstate` apply React updates.

## Architecture

```
lib/client/appNavigationHistory.ts   ← pure encode/decode, trap helpers
lib/client/useAppNavigation.ts       ← bootstrap, pushScreen, navigateBack, popstate
        ↓
HomeScreen.tsx                         ← overlay + view sync
SettingsScreen.tsx                     ← viewState sync
        ↓
OverlayShell / SettingsSubPageShell    ← useSwipeBack({ onBack: navigateBack })
```

**Single back pipeline:** Shell `onBack` buttons also call `navigateBack()` (not direct `setState`).

## Bootstrap (once per session)

On `HomeScreen` mount (client):

1. `history.replaceState({ snap1099: "home" }, "")`
2. `history.pushState({ snap1099: "home" }, "")` — trap duplicate

When user presses back at root trap: pops to first `home` entry; UI unchanged; next back may exit app.

## Forward examples

| User action | pushState key |
|-------------|---------------|
| Open privacy overlay | `overlay:privacy-trust` |
| Missing list → item | `overlay:missing-deduction-item:{hintId}` |
| Home → Settings | `settings` |
| Settings → Language | `settings:language` |
| Sample export flow pages | `settings:sample-export` / `settings:export-completed` |

Before push: skip if current history state already matches target key.

## Dead-loop prevention

1. **`navigatingRef`:** While applying `popstate` to React, ignore re-entrant pushes.
2. **Dedupe push:** Compare serialized `snap1099` key; no consecutive duplicate entries.
3. **Directed graph only:** No arbitrary stack; keys match product IA (same as `< BACK` today).
4. **export-completed side effects:** Run in `popstate` handler when leaving `settings:export-completed` (same as current `handleHeaderBack`).

## Files

| Path | Action |
|------|--------|
| `lib/client/appNavigationHistory.ts` | **New** — state keys, encode/decode, trap init pure helpers |
| `lib/client/appNavigationHistory.test.ts` | **New** — key parsing, dedupe logic |
| `lib/client/useAppNavigation.ts` | **New** — hook: bootstrap, pushScreen, navigateBack, popstate listener |
| `components/home/HomeScreen.tsx` | **Modify** — wire overlay/view to History |
| `components/settings/SettingsScreen.tsx` | **Modify** — wire viewState to History |
| `components/home/overlays/OverlayShell.tsx` | **Modify** — `onBack` → `navigateBack` |
| `components/settings/SettingsSubPageShell.tsx` | **Modify** — same |
| `components/settings/SettingsHeader.tsx` | **Modify** — main settings back uses `navigateBack` |
| `docs/superpowers/specs/2026-06-18-swipe-back-navigation-design.md` | **Note** — superseded by History sync for back behavior |

## Testing

### Unit

- State key encode/decode round-trip
- Dedupe: same key twice → should not push
- popstate mapping table for each overlay/settings state

### Manual (Android Chrome PWA standalone)

- privacy overlay → swipe / system back → Home (app stays open)
- Missing list → item → back → list → back → Home
- Home → Settings → Language → back → Settings main → back → Home
- At Home trap: first system back → no exit; second back → app may close
- Widget pager horizontal swipe unchanged
- Camera / Paywall sheets: back dismisses sheet only

## Success criteria

- Sub-flow swipe or system back returns **one in-app level**, not app exit
- Behavior matches `< BACK` button on every mapped screen
- No navigation loops
- Root trap prevents accidental single-back exit from Home

## Out of scope

- Help page (`/help` route) — separate route; future spec
- iOS Safari swipe-from-edge (no system back); in-app swipe still via `useSwipeBack`
- Sheet-level History entries
