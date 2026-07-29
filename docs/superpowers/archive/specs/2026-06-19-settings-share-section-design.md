# Settings Share Section Collapsible Redesign — Design

**Date:** 2026-06-19  
**Status:** Approved (design)  
**References:** `docs/ui/snap1099-share-spec_1.png`  
**Scope:** Refactor `ShareAppSection` only — collapsible share block in Settings main view.

## Summary

Replace the current avatar + 3-column tile layout with a collapsible Share App section matching the spec visual language. Collapsed row shows title + hero tagline; expanded panel shows hero card, message preview, and three branded channel buttons (WhatsApp, Facebook, More). No Copy Link row, stats strip, or success/pressed interaction states.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Interaction | Collapsible — default collapsed; tap header to expand |
| Expanded content | **3 channel buttons only** (Hero + Message preview removed 2026-06-19) |
| Buttons | Spec styling — 62px, brand bg/border, title + subtitle |
| Collapsed subtitle | Hero tagline |
| Removed | Hero card, YOUR MESSAGE preview, Copy Link, stats strip, avatars, success/pressed states |
| Unchanged | `shareApp.ts` handlers; share `message` payload; other Settings blocks |

## Visual spec

### Collapsed trigger

- Full-width row inside rounded card, `min-h-[4.5rem]`
- Left: share icon; title `SHARE APP`; subtitle = `heroTagline`
- Right: chevron (rotates when expanded)

### Expanded panel

- **Channels only:** stacked 10px gap; WhatsApp `#0A1F10`/`#1a5c2e`, Facebook `#0A1020`/`#1048a0`, More zinc
- No Hero card or message preview bubble

### Behavior

- WhatsApp / Facebook → `openExternalShare` (existing URLs)
- More → `shareAppViaNative`; toast on copied/failed
- Expand state: local `useState`, not persisted

## Files

| Path | Action |
|------|--------|
| `components/settings/ShareAppSection.tsx` | Refactor |
| `lib/ui/settingsVisual.ts` | `share.*` tokens |
| `lib/i18n/types.ts` + locales | New share strings |

## Out of scope

- Copy Link row, stats, Edit Message sheet
- New routes or viewState
- Referral backend

## Success criteria

- Settings share block matches approved collapsible spec layout
- Three share channels work as before
- No changes outside `ShareAppSection` + i18n/visual tokens
