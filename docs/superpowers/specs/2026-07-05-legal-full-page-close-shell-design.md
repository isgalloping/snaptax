# Legal Full-Page Close Shell — Design

**Date:** 2026-07-05  
**Status:** Approved (S3 + Approach A, user 2026-07-05)  
**References:** `components/legal/LegalSheet.tsx` · `lib/legal/locales.ts`  
**Scope:** All public compliance full pages — no LegalSheet / Paywall / Help changes.

## Problem

Compliance full pages (`/pricing`, `/refund`, `/policies`, `/privacy`, `/terms`, `/data-retention`, `/security`) use a top-left **« Back to Snap1099** pattern. Settings legal entries for Terms/Privacy use **LegalSheet** with top-right **Close** and a scrollable body. The mismatch confuses in-app navigation; long pages do not keep the header fixed while scrolling.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Scope | **S3** — all compliance full pages listed above |
| Approach | **A** — shared `LegalFullPageShell` component |
| Close label | `getLegalBundle(locale).close` (i18n) |
| Close action | `history.length > 1` → `router.back()`; else → `router.push("/")` |
| Scroll | `h-dvh flex flex-col`; header `shrink-0`; main `flex-1 overflow-y-auto` |
| Escape | Same as Close (`useDialogEscape`) |
| Paddle URLs | Unchanged — routes remain full pages |

## Component: `LegalFullPageShell`

Client component props:

- `title: string`
- `subtitle?: string`
- `children: React.ReactNode`

Layout:

- Root: `flex h-dvh flex-col bg-black text-white`
- Header: `shrink-0 border-b-4 border-yellow-500 bg-zinc-900 p-4`
  - Row: title (`text-lg font-black uppercase tracking-wider`) + Close button (LegalSheet classes)
  - Optional subtitle: `text-xs text-zinc-400 mt-2`
- Main: `flex-1 overflow-y-auto`
  - Inner: `mx-auto max-w-2xl w-full p-6 pb-16`

Close button matches LegalSheet:

`min-h-12 min-w-12 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider transition-transform active:scale-95`

## Migration

| File | Change |
|------|--------|
| `components/legal/LegalFullPageShell.tsx` | **New** |
| `components/legal/PricingPageContent.tsx` | Wrap body in shell; remove Back Link |
| `components/legal/LegalMarkdownPage.tsx` | Use shell; remove custom header/back |
| `components/legal/LegalPageContent.tsx` | Use shell; remove Back Link |
| `components/legal/PoliciesHubContent.tsx` | Use shell; remove Back button |

Pricing page remains a server page; shell is client, children can be server-rendered inside client boundary via composition (PricingPageContent becomes client or splits server data into client child).

## Out of scope

- LegalSheet overlay behavior
- Pricing/refund content or style unification (reverted)
- Settings row navigation (`href` vs `onClick`)

## Success criteria

1. No compliance full page shows « Back to Snap1099.
2. All six routes show top-right Close matching LegalSheet.
3. Long content scrolls inside main; header stays visible.
4. Escape closes page (back or home).
5. Direct URL visit with no history: Close → `/`.

## Testing

- Manual: Settings → each full-page link → Close returns to Settings.
- Manual: Direct `/pricing` → Close → `/`.
- Manual: `/privacy` long content — header fixed, body scrolls.
