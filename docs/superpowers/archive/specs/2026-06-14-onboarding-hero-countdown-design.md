# Onboarding Hero — Countdown + Dwell Fix Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-hero-auto-advance-design.md`](./2026-06-14-onboarding-hero-auto-advance-design.md)

**Brainstorming approved:** 2026-06-14 — button-integrated countdown (option A); hero session lock; 3s dwell from Hero mount.

---

## 1. Problem

Testing showed Hero does not reliably stay **3 seconds**. Root causes:

1. **`LANDING_SOFT_MAX_MS` (5s from page load)** can force exit before Hero completes 3s dwell when `pending` + IDB resolution delays Hero mount.
2. **`resolveExit` `variant === "none"`** bypass after `commitHeroLandingStart()` can exit via poll tick without respecting hero dwell.
3. **No countdown UI** — users cannot perceive the 3s wait.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Dwell anchor | **HeroWelcomeLanding mount** (`t=0`) |
| Auto-advance | **3000ms** from mount (unchanged) |
| CTA enabled | **1500ms** (unchanged) |
| Countdown display | **In button** — `Let's Go! (3)` → `(2)` → `(1)`; then `Let's Go! ⚡` when tappable |
| Gate exit during hero | **Blocked** until `LANDING_CTA_EVENT` (hero session lock) |
| Resume `stage_1+` | Skip Hero (unchanged) |

---

## 3. Architecture

### 3.1 Hero session (`lib/landing/heroLandingSession.ts`)

- `beginHeroLandingSession()` on Hero mount
- `endHeroLandingSession()` in `startOnboarding()` before dispatching `LANDING_CTA_EVENT`
- `isHeroLandingSessionActive()` → `resolveExit` returns `null` for **all** poll paths (including soft max and `variant none`)

### 3.2 Countdown (`HeroWelcomeLanding.tsx`)

- Poll `heroCountdownSeconds()` every 100ms
- Before `ctaReady`: label `ctaCountdown` template with `{seconds}`
- After `ctaReady`: `cta` (`Let's Go! ⚡`)

### 3.3 Flow

```text
Hero mount → beginHeroLandingSession()
  ├─ 0–1500ms: Let's Go! (3)/(2) disabled
  ├─ 1500ms: enabled → Let's Go! ⚡
  ├─ tap → endHeroLandingSession + CTA event
  └─ 3000ms auto → same as tap
LandingGate: poll blocked while session active; exit on CTA event only
```

---

## 4. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-HC1 | Fresh `not_started`: Hero visible ≥3s before auto-advance (even if pending delayed) |
| AC-HC2 | Button shows `Let's Go! (3)` → `(2)` → `(1)` while disabled |
| AC-HC3 | At 1500ms button enables with `Let's Go! ⚡` |
| AC-HC4 | Early tap / auto fires once only |
| AC-HC5 | `stage_1+` resume skips Hero (unchanged) |
| AC-HC6 | `resolveExit` returns null while hero session active (incl. soft max) |

---

## 5. Files

| File | Change |
|------|--------|
| `lib/landing/heroLandingSession.ts` | New session + countdown helpers |
| `lib/landing/landingTiming.ts` | Block poll exit during hero session |
| `components/landing/HeroWelcomeLanding.tsx` | Session lifecycle + countdown label |
| `lib/i18n/types.ts`, locales | `ctaCountdown` template |
| `lib/landing/landingTiming.test.ts` | Hero session cases |
| `lib/landing/heroLandingSession.test.ts` | Unit tests |
