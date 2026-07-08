# Landing A/B + Vercel Flags — Design

> **Superseded** by [`2026-06-10-unified-data-stream-splash-design.md`](./2026-06-10-unified-data-stream-splash-design.md) (2026-06-10). A/B, Flags, and variant cookie are removed.

**Date:** 2026-06-10  
**Status:** Approved (implemented)  
**Scope:** Two landing variants (`data_stream`, `simple_using`) on every cold start (max 2.5s); auth decoupled from startup gate.

**UI v2 specs (canonical UI detail):**

- [`2026-06-10-data-stream-landing-v2-design.md`](./2026-06-10-data-stream-landing-v2-design.md)
- [`2026-06-10-simple-using-landing-v2-design.md`](./2026-06-10-simple-using-landing-v2-design.md)

## Problem

Cold start showed bare `Loading…` until IndexedDB + auth completed. No A/B infrastructure or branded startup.

## Decisions

| Topic | Choice |
|-------|--------|
| Landing frequency | Every cold start (PWA open / full refresh) |
| A/B stickiness | Cookie `snap1099_landing_variant` (1y), client-written after SSR |
| Max landing | **2.5s** hard timeout |
| Min auto hold | `data_stream` **2400ms** · `simple_using` **1200ms** |
| `simple_using` exit | CTA early dismiss + auto timeout |
| Auth blocking | Removed — `auth.hydrated` does not block home |
| Flags | `flags` package + Server Component read + client cookie persist |
| Animations | Pure CSS keyframes only |

## Architecture (implemented)

```
GET /
  → app/page.tsx (Server Component)
  → resolveLandingVariant()
       1. dev: LANDING_VARIANT env (NODE_ENV !== production)
       2. else: read cookie
       3. else: evaluate(landingVariant) 50/50
  → StartupShell(landingVariant)
       → persistLandingVariantCookie() on client mount
       → HomeScreen (under overlay)
       → LandingGate → DataStreamLanding | SimpleUsingLanding
```

**Note:** Next.js 16 forbids `cookies().set()` in Server Components. Cookie is persisted client-side in `StartupShell`.

## Dismiss timing

```typescript
const VARIANT_MIN_MS = {
  data_stream: 2400,
  simple_using: 1200,
} as const;

dismissAt = Math.min(VARIANT_MIN_MS[variant], 2500);
```

## Flags

| Path | Role |
|------|------|
| `flags/landing.ts` | `landingVariant` flag (50/50 `decide`) |
| `lib/landing/resolveLandingVariant.ts` | SSR variant resolution |
| `lib/landing/persistLandingVariantCookie.ts` | Client cookie write |
| `app/.well-known/vercel/flags/route.ts` | Vercel Toolbar discovery |

### Cookie

- Name: `snap1099_landing_variant`
- Values: `data_stream` | `simple_using`
- Client-set: `Max-Age=31536000`, `SameSite=Lax`, not HttpOnly

### Environment variables

| Variable | Where effective | Purpose |
|----------|-----------------|---------|
| `LANDING_VARIANT` | **Non-production only** (`NODE_ENV !== "production"`) | Force variant in local dev |
| *(unset in production)* | Production | Cookie sticky + Flags 50/50 — **correct** |

Production must **not** set `LANDING_VARIANT`; doing so is ignored by `readEnvOverride()`.

## Components

```
components/landing/
├── LandingGate.tsx
├── StartupShell.tsx
├── DataStreamLanding.tsx (+ subcomponents)
├── SimpleUsingLanding.tsx
├── landing.css
└── …
```

See v2 specs for UI copy and layout.

## Engineering constraints

1. Landing overlay ≤ **2500ms**
2. CSS-only animations
3. Full-screen overlay, not modal
4. Offline cold start works from cookie / flag default
5. PWA precache of `/` unchanged

## Testing

1. Production (no `LANDING_VARIANT`): 50/50 first visit, sticky cookie thereafter
2. Local: `LANDING_VARIANT=simple_using` in `.env.local` + dev server
3. CTA + 2.5s fuse on `simple_using`
4. `npm run build` passes

## Related docs

- `docs/superpowers/specs/2026-06-07-fast-startup-local-first-design.md`
- `docs/product/PRODUCT-SPEC.md` §2.1

## Out of scope

- Middleware / proxy layer (removed; SC + client cookie)
- Skipping landing for returning users
- Analytics wiring
