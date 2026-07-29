# Cold Start — Landing First Paint — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Scope:** Reduce time from app icon tap to Landing first paint (metric D). Target ≤2.5s production PWA / ≤4s dev.

**Problem:** ~13s black screen before Landing appears. Landing timer (≤2.5s) is not the bottleneck; heavy JS bundle + dynamic SSR block first paint.

## Root cause

1. `StartupShell` synchronously imports `HomeScreen` → entire camera/settings tree in critical path
2. `app/page.tsx` async SSR (`resolveLandingVariant` + Flags) delays TTFB
3. `HomeScreen` mounts under overlay but still forces parse of full module graph

## Decisions

| Topic | Choice |
|-------|--------|
| Metric | **D** — tap → Landing first visible |
| Approach | Critical path split (方案 1) |
| `/` route | Static client entry |
| Variant resolution | Client-side (`resolveLandingVariantClient`) |
| HomeScreen | `next/dynamic`, `ssr: false`, mount after landing dismiss |
| Prefetch | `requestIdleCallback` import HomeScreen during landing |
| Landing product rules | Unchanged (every cold start, ≤2.5s fuse) |
| Dev override | `LANDING_VARIANT` → `NEXT_PUBLIC_LANDING_VARIANT` via next.config |

## Architecture

```
app/page.tsx (static)
  └─ StartupShell
       boot: bg-zinc-950 placeholder (SSR + hydration match)
       mount: resolve variant client → LandingGate
       landingDone: dynamic(HomeScreen)
```

## Performance marks

- `startup:shell` — StartupShell mounted + variant resolved
- `startup:landing-paint` — LandingGate mounted
- `startup:home-ready` — HomeScreen mounted

Dev: log deltas to console.

## Acceptance

| Environment | Tap → Landing paint |
|-------------|---------------------|
| Production PWA 4G | ≤ 2.5s |
| Dev / vercel dev | ≤ 4s (best effort) |

## Out of scope

- `/api/receipts` latency
- Shortening landing animation duration
- auth fetchSeasonPaid parallelization

## Related

- `2026-06-10-landing-flags-design.md`
- `2026-06-07-fast-startup-local-first-design.md`
