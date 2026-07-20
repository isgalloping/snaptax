# WCAG 2.2 AA Conformance Summary (VPAT-lite)

**Product:** Snap1099 PWA  
**Date:** 2026-06-30  
**Target:** WCAG 2.2 Level **AA** on core contractor flows  
**Audit:** [WCAG-22-AA-audit-2026-06-30.md](./WCAG-22-AA-audit-2026-06-30.md)

---

## Conformance statement

Snap1099 core paths (Home + Settings overlay) meet WCAG 2.2 Level AA for **automated critical/serious** checks via axe-core (June 2026 baseline). Manual keyboard and screen-reader validation is recommended before each release.

---

## Supported environments

| Client | Support level |
|--------|---------------|
| iOS Safari (PWA) | Primary — VoiceOver spot-check |
| Android Chrome | Best effort |
| Desktop Chrome / Edge | Dev + keyboard testing |

---

## Criteria coverage (core paths)

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.4.3 Contrast (AA) | **Supports** | Black/white/yellow AAA; zinc secondary text ≥ zinc-400 on dark surfaces |
| 1.4.4 Resize text | **Supports** | Mobile-first layout; 200% zoom manual check |
| 2.1.1 Keyboard | **Supports** | Snap, Settings, list cards, sheets (Escape closes) |
| 2.4.7 Focus visible | **Supports** | Global `:focus-visible` yellow ring |
| 2.5.8 Target size (AA) | **Supports** | PRODUCT ≥64px core; sync control min 44px |
| 4.1.2 Name, Role, Value | **Supports** | Dialog `aria-modal`; list cards labeled; tax `aria-live` |
| 2.3.3 Animation (AA) | **Partial** | `prefers-reduced-motion` on coach/export pulse; camera shutter motion not reduced |

---

## Known gaps (non-core / backlog)

| Gap | Priority | Plan |
|-----|----------|------|
| Camera overlay full keyboard path | P1 | M3.1 |
| Paywall / Export engine sheet axe pass | P1 | M3.1 |
| `/help` marketing page audit | P2 | M3.1 |
| Landmark / heading hierarchy (moderate axe) | P2 | Incremental |
| Automated a11y in CI | P2 | Optional Storybook + axe job |

---

## Verification commands

```bash
npm run dev
npm run a11y:audit   # 0 critical / 0 serious on Home + Settings
npm run test:unit
```

---

## Contact

Accessibility feedback: **snaptax.lightxforge@gmail.com** (subject: Accessibility)
