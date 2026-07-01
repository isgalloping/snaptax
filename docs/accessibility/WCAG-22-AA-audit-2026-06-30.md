# WCAG 2.2 AA Baseline Audit — Snap1099

**Date:** 2026-06-30  
**Tool:** `@axe-core/playwright` (wcag2a · wcag2aa · wcag22aa tags)  
**Script:** `npm run a11y:audit` (requires `npm run dev` on `A11Y_BASE_URL`, default `http://localhost:3000`)

## Scope (P4 critical paths)

| Path | Route / state | Result (post-fix) |
|------|---------------|-------------------|
| Home | `/` after landing exit | 0 critical · 0 serious |
| Settings | Settings overlay from header | 0 critical · 0 serious |

**Not scanned in automation:** Camera overlay, receipt detail sheet, Paywall, Delete Account (manual keyboard pass recommended).

---

## Baseline findings (pre-fix, 2026-06-30)

| ID | Impact | Location | Issue | Fix (M3-2) |
|----|--------|----------|-------|------------|
| `aria-required-children` | critical | WidgetPager viewport | `role="list"` without `listitem` children | Changed to `role="region"` |
| `aria-required-parent` | critical | Tax insight widgets | `role="listitem"` on buttons without list parent | Removed redundant `listitem` |
| `color-contrast` | serious | Receipt list heading / empty state | `text-zinc-500` on `bg-zinc-900` | Bumped to `text-zinc-400` |
| `color-contrast` | serious | Export card trust footnote | `text-zinc-500` on dark card | `settingsVisual.trustFootnote` → zinc-400 |
| Keyboard | P0 (manual) | Receipt list cards | `div` click-only rows | `role="button"` + Enter/Space + `aria-label` |
| Keyboard | P0 (manual) | Legal / receipt / delete sheets | No Escape to close | `useDialogEscape` + `aria-modal` |
| Focus visible | P0 | Global | No consistent focus ring | `:focus-visible` yellow outline in `globals.css` |
| Motion | P0 | Coach / export animations | `prefers-reduced-motion` partial | Extended to `animate-pulse` / `animate-spin` / tax bounce |
| Screen reader | P0 | Tax header | Est. Tax Saved updates silent | `aria-live="polite"` on amount |

---

## Post-fix verification

```
npm run dev
npm run a11y:audit
# Done. Critical/serious across paths: 0
```

**Remaining moderate (non-blocking):** 1 minor violation per path (axe `moderate` / `minor` — e.g. landmark structure); tracked for M3.1 backlog.

---

## Manual checklist (recommended each release)

- [ ] Keyboard-only: Snap → Settings → Privacy Sheet → Escape
- [ ] Keyboard-only: Open receipt → Close → Delete confirm → Escape
- [ ] VoiceOver (iOS Safari PWA): Est. Tax Saved announced on update
- [ ] 200% browser zoom: home scroll without horizontal overflow

---

## Related

- [WCAG-22-AA-summary.md](./WCAG-22-AA-summary.md)
- [2026-06-30-compliance-p4-accessibility-wcag22-aa.md](../superpowers/specs/2026-06-30-compliance-p4-accessibility-wcag22-aa.md)
