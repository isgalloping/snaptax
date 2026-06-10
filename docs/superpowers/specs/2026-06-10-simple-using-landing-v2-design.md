# simple_using Landing V2 — Mockup Screen 1 — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Scope:** Replace pill carousel `simple_using` with mockup Screen 1 (camera hero + 3 status lines + Let's Start CTA). `data_stream` unchanged.

**Parent spec:** [`2026-06-10-landing-flags-design.md`](./2026-06-10-landing-flags-design.md)

## Problem

Current `simple_using` uses progress pills + 3-slide carousel at the bottom third of the screen. Approved mockup is a centered welcome gate: glowing camera, three stacked mono status lines, and a full-width yellow CTA.

## Decisions

| Topic | Choice |
|-------|------|
| Exit | **A** — CTA early dismiss + **2.5s** hard timeout |
| CTA tap | From **600ms** (after fade-in); clears auto timer |
| Min auto hold | **1200ms** |
| Max hold | **2500ms** (unchanged) |
| Animation | Pure CSS only |
| Local dev | `LANDING_VARIANT` overrides cookie when `NODE_ENV !== 'production'` |

## Layout

```
Hero: LandingCameraHero (scaled up)
Body: 3 mono status lines (stagger fade-in, all visible)
Footer: full-width yellow "Let's Start →" (≥64px)
Background: bg-zinc-950 + grid (shared with data_stream)
```

## Copy

1. `[ ⚙️ SYSTEM ] Secure local vault initialized...`  
2. `[ 💡 TAX TIP ] IRS Line 9 Standard loaded.`  
3. `[ 📸 PAIN ] Stop the 'Dashboard Pile'. Snap it now.`  

**CTA:** `Let's Start →`

## Timing

| Event | Time |
|-------|------|
| Line 1 fade | 0ms |
| Line 2 fade | 200ms |
| Line 3 fade | 400ms |
| CTA fade + tappable | 600ms |
| Min auto dismiss | 1200ms |
| Max dismiss | 2500ms |

## Components

- `simpleUsingCopy.ts` — copy constants  
- `SimpleUsingLanding.tsx` — layout + `onStart` prop  
- `LandingGate.tsx` — unified dismiss + timer cleanup  
- `resolveLandingVariant.ts` — non-prod env override  

Remove `SIMPLE_USING_SLIDES`, pill/slide CSS if unused.

## Out of scope

Mockup screens 2–4 (camera, Flash Done, dashboard).

## Testing

1. `.env.local` `LANDING_VARIANT=simple_using` → always simple_using in dev  
2. CTA dismisses early; idle dismisses by 2.5s  
3. Build passes; no hydration mismatch  
