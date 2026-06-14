# Onboarding Hero — Auto Advance + CTA Timing Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:** [`2026-06-14-onboarding-hero-first-visit-design.md`](./2026-06-14-onboarding-hero-first-visit-design.md) §5.2 Behavior, §5.1 Carousel dots

**Brainstorming approved:** 2026-06-14 — 3s auto-enter; CTA ready at **1500ms**; keep 3 dots above Let's Go; no 4-dot carousel below button.

---

## 1. Problem

Stage 0 Hero requires tapping **Let's Go** to enter the main screen. Product wants a **3s dwell** then auto-advance for first-time users, while still allowing early tap. Mockup shows 4 carousel dots below the CTA — product rejects those; keep only the **3 dots above** the button.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Auto-advance delay | **3000ms** after Hero mount |
| CTA enabled | **1500ms** (early tap allowed) |
| Auto action | Same as manual: `commitHeroLandingStart()` + `LANDING_CTA_EVENT` |
| Idempotent | `startedRef` — auto and manual fire once only |
| Dots above CTA | **Keep** (3 spans: yellow + 2 grey) |
| Dots below CTA | **Do not render** (no 4-dot carousel) |
| Offline fallback | Unchanged — `LANDING_SOFT_MAX_MS` 5s |

---

## 3. Flow

```text
Hero mount
  ├─ 1500ms → Let's Go enabled
  ├─ user tap (if not started) → stage_1 + landing exit
  └─ 3000ms (if not started) → same as tap
```

---

## 4. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-HA1 | Fresh `not_started` user: Hero auto-enters main screen at ~3s |
| AC-HA2 | Let's Go disabled until 1500ms, then tappable |
| AC-HA3 | Tap before 3s skips auto timer (no double transition) |
| AC-HA4 | Three dots above button visible; zero dots below button |
| AC-HA5 | Return visit `completed` → data_stream unchanged |

---

## 5. Files

| File | Change |
|------|--------|
| `components/landing/HeroWelcomeLanding.tsx` | 1500ms CTA + 3000ms auto-advance + startedRef |
| `lib/landing/heroLandingTiming.ts` | Optional constants (if extracted) |
