# Onboarding Hero — 5s Dwell Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-hero-countdown-design.md`](./2026-06-14-onboarding-hero-countdown-design.md)

**Brainstorming approved:** 2026-06-14 — auto-advance **5s**; early tap still **1500ms**; button countdown option A.

---

## 1. Problem

Product wants first-visit Hero to dwell **5 seconds** (was 3s) before auto-entering the main screen, while keeping early tap at 1.5s.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Auto-advance | **5000ms** from Hero mount |
| CTA enabled | **1500ms** (unchanged) |
| Countdown | Button label **5 → 4 → 3 → 2 → 1**, then `Let's Go! ⚡` when tappable |
| Hero session lock | Unchanged — blocks poll exit until CTA |
| `LANDING_SOFT_MAX_MS` | Unchanged (5000) — session lock covers hero dwell |
| Resume `stage_1+` | Skip Hero (unchanged) |

---

## 3. Flow

```text
Hero mount (t=0)
  ├─ 0–1500ms: Let's Go! (5)/(4) disabled
  ├─ 1500ms: enabled → Let's Go! ⚡
  ├─ tap → stage_1 + landing exit
  └─ 5000ms auto → same as tap
```

---

## 4. Implementation

| File | Change |
|------|--------|
| `lib/landing/heroLandingTiming.ts` | `HERO_AUTO_ADVANCE_MS = 5000` |
| `components/landing/HeroWelcomeLanding.tsx` | Derive initial countdown from `HERO_AUTO_ADVANCE_MS / 1000` (remove hardcoded `3`) |
| `lib/landing/heroLandingSession.test.ts` | Add 5s countdown cases; keep 3s cases parameterized |
| `docs/superpowers/specs/2026-06-14-onboarding-hero-countdown-design.md` | Cross-reference only (no rewrite) |

No i18n changes — `ctaCountdown` template already uses `{seconds}` dynamically.

---

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-5S1 | Fresh `not_started`: Hero auto-enters at ~5s |
| AC-5S2 | Let's Go enabled at 1500ms with `Let's Go! ⚡` |
| AC-5S3 | Countdown shows **5 → 4 → 3 → 2 → 1** while disabled |
| AC-5S4 | Early tap / auto fires once only |
| AC-5S5 | `stage_1+` resume skips Hero |

---

## 6. Testing

- `npm run test:unit` — `heroLandingSession.test.ts` covers 5s boundaries
- Manual: clear site data → cold start → observe 5s dwell + countdown
