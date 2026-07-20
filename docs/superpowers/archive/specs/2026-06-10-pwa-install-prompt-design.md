# PWA Install Prompt — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Platform scope:** Android Chrome / Edge (mobile browser)  
**Problem:** After uninstalling the PWA, visiting in browser shows no install banner; banner may never appear or feels like it “cold disappears” after Landing → home. **Not now** must reliably dismiss for 7 days.

## References

| Doc | Relevance |
|-----|-----------|
| `components/pwa/InstallPrompt.tsx` | Current implementation |
| `components/pwa/PwaProvider.tsx` | Mount point |
| `components/landing/LandingGate.tsx` | Sets `html.landing-done` |
| `docs/superpowers/specs/2026-06-07-user-facing-english-design.md` | Copy keys (`USER_COPY.pwa`) |
| `docs/tech/02-frontend.md` §2.5 | PWA install prompt location |

---

## Problem

### User report (Android Chrome)

1. User deletes installed PWA, opens site in browser → enters home normally but **no install prompt**.
2. After Landing finishes and main home is visible, any hint of install UI **does not persist** (never shown or gone without user action).
3. Expected: user can tap **Not now** to dismiss without installing.

### Root causes (code)

| Cause | Detail |
|-------|--------|
| **Hydration race** | `beforeinstallprompt` fires **once per navigation**. Listener registered in `InstallPrompt` `useEffect` runs **after** React hydrate. Event often fires during SSR/Landing/hydrate → **missed permanently** for that visit. |
| **No show gate** | Prompt may render during Landing (`z-40` same as `#landing-ssr-layer`) → poor UX; user perception = “disappeared when home loaded”. |
| **Not now not persisted** | `dismissed` is React state only → refresh shows again; does not match intentional dismiss semantics. |

### Out of browser control

Chrome may delay `beforeinstallprompt` after uninstall until **engagement heuristics** (interaction, return visit). Design fixes **capture when eligible**, not force eligibility.

---

## Goals

| ID | Goal |
|----|------|
| **G1** | Never miss `beforeinstallprompt` due to late React listener |
| **G2** | Show install bar **only after** Landing exit (`html.landing-done`) |
| **G3** | **Not now** suppresses bar for **7 days** (localStorage) |
| **G4** | Never show in **standalone** (already installed PWA) |
| **G5** | Do not block core Snap flow (bar above home chrome, not inside camera overlay) |

## Non-goals

- iOS Safari “Add to Home Screen” manual instructions (Android-only scope)
- Re-prompting inside 7 days after Not now
- Changing manifest / SW installability criteria

---

## Architecture

```
Navigation start
    │
    ▼
lib/pwa/deferredInstall.ts (import side-effect)
    │  beforeinstallprompt → preventDefault → store event + notify subscribers
    │
    ▼
Landing (SSR + LandingGate)
    │  html.landing-done on exit
    │
    ▼
InstallPrompt (client)
    │  if standalone → hide
    │  if dismissed within 7d → hide
    │  if !landing-done → hide
    │  if deferred event exists → show bottom bar
    │
    ▼
User: Install → prompt() / Not now → write dismissed_at
```

---

## §1 Early event capture

**New file:** `lib/pwa/deferredInstall.ts`

```typescript
// Module-level singleton — registers on first import (client bundle only)
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function initDeferredInstallCapture(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((fn) => fn());
  });
}

export function getDeferredInstallPrompt() { return deferred; }
export function subscribeInstallPrompt(cb: () => void): () => void { ... }
export function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches;
}
```

**Wiring:**

- Call `initDeferredInstallCapture()` at module bottom (or top of `PwaProvider.tsx` after import).
- `InstallPrompt.tsx` imports `@/lib/pwa/deferredInstall` for side effect **before** any delayed hooks.

**Optional fallback (only if QA still sees misses):** inline `<script>` in `app/layout.tsx` `<body>` start that assigns the same global queue — **not required for v1** if module import runs early enough via `PwaProvider`.

---

## §2 Show gate — after Landing

**Rule:** Render install bar only when **all** true:

1. `!isStandalone()`
2. `getDeferredInstallPrompt() != null`
3. `!isInstallDismissed()` (§3)
4. `document.documentElement.classList.contains("landing-done")`

**Landing detection:**

- Primary: `MutationObserver` on `<html class="...">` watching for `landing-done`.
- Alternative (simpler): poll once on interval until class present, then subscribe — prefer **MutationObserver** for zero polling.

**Custom event (optional enhancement):** `LandingGate.finishExit` dispatches `window.dispatchEvent(new Event("snap1099:landing-done"))` for explicit hook — reduces observer complexity. **Recommended:** add this one line in `finishExit` + listen in `InstallPrompt`.

**Offline pack path:** `landing-done` still set on exit → same gate applies.

---

## §3 Not now — 7-day dismiss

| Key | Value |
|-----|-------|
| Storage | `localStorage` |
| Key | `snap1099_pwa_install_dismissed_at` |
| Value | ISO-8601 timestamp string |

```typescript
const DISMISS_DAYS = 7;

function isInstallDismissed(): boolean {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  const dismissedAt = Date.parse(raw);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_DAYS * 864e5;
}

function dismissInstallPrompt(): void {
  localStorage.setItem(KEY, new Date().toISOString());
}
```

**Not now button:** `dismissInstallPrompt()` + hide bar (local state).

**Install accepted:** clear deferred event; no dismiss key write (user installed).

**Install dismissed (native prompt):** keep deferred if Chrome allows re-prompt; bar stays hidden only if user tapped our **Not now**.

---

## §4 UI / z-index

| Element | z-index | Notes |
|---------|---------|-------|
| `#landing-ssr-layer` | 40 | Hidden when `landing-done` |
| Install bar | **50** | Above home; same tier as sheets but **bottom** anchored — no overlap with Snap button if bar is separate strip |
| Camera overlay | 50 | Full screen when open — install bar hidden implicitly (camera covers) or keep hidden while `cameraOpen` **optional** — **v1: no camera gate** (bar not mounted during camera if home unmounted under overlay; bar remains in layout — may peek under camera). **v1 accept:** bar at layout root; camera is full-screen `z-50` overlay → covers bar. OK. |

Copy unchanged: `USER_COPY.pwa.*`.

---

## §5 InstallPrompt refactor

Replace inline `beforeinstallprompt` listener with:

1. Subscribe to `deferredInstall` + `snap1099:landing-done`
2. State: `{ visible: boolean }` derived from §2 rules
3. `handleInstall`: existing `prompt()` + `userChoice` handling
4. `handleDismiss`: §3 + set visible false

Remove duplicate listeners from current `useEffect`.

---

## §6 Edge cases

| Case | Behavior |
|------|----------|
| Standalone PWA | Never show |
| Event before import | Prevented by early import in `PwaProvider` |
| Event never fires (Chrome heuristic) | No bar — acceptable; document in QA |
| User clears site data | Dismiss reset; prompt shows again when eligible |
| Landing soft-max → offline pack | `landing-done` still applied → bar can show on offline shell |
| 7-day expiry | After 7 days, show again if `beforeinstallprompt` still held or re-fired on new navigation |

---

## §7 Files

| File | Action |
|------|--------|
| `lib/pwa/deferredInstall.ts` | **New** — capture + dismiss helpers |
| `components/pwa/InstallPrompt.tsx` | Refactor — gates + 7d dismiss |
| `components/pwa/PwaProvider.tsx` | Import side-effect init |
| `components/landing/LandingGate.tsx` | Dispatch `snap1099:landing-done` in `finishExit` |
| `docs/tech/02-frontend.md` | One-line note on early capture + 7d dismiss |

---

## §8 Testing (manual — Android Chrome)

1. **Happy path:** Uninstall PWA → open in Chrome → wait Landing → install bar visible at bottom.
2. **Not now:** Tap Not now → bar gone → reload within 7 days → no bar.
3. **Expiry:** Manually set `dismissed_at` to 8 days ago in DevTools → reload → bar shows if event captured.
4. **Standalone:** Open installed PWA → no bar.
5. **No flash during Landing:** Bar must not appear before `landing-done`.
6. **Install:** Tap Install → native prompt → accept → app installed, bar gone.

**Dev note:** `beforeinstallprompt` may not fire on `localhost` unless Lighthouse PWA checks pass; use production HTTPS or Chrome DevTools → Application → Manifest → “Installability”.

---

## §9 Decision log

| Date | Decision |
|------|----------|
| 2026-06-10 | Platform: Android Chrome / Edge |
| 2026-06-10 | Approach: module-level early capture + post-Landing show gate |
| 2026-06-10 | Not now: **7-day** localStorage suppress |
| 2026-06-10 | Optional inline script deferred unless QA finds remaining race |

---

## Approval

Design approved by user (2026-06-10). Next step: **writing-plans** → implementation plan, then code.
