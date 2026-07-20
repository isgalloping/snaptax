# Settings Share Layout & Section Titles — Design

**Date:** 2026-06-19  
**Status:** Approved  
**Scope:** Settings main view — reorder Share below Preferences, rename section titles, restyle Share as PrefRow card.

## Summary

Move Share App below Preferences & Actions. Rename section titles per mockup. Restyle Share as a single PrefRow-style row inside the same card container as Preferences; tap expands three channel buttons inline. Compact spacing between widgets.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Preferences list | Unchanged rows (Language, Industry, Notifications, Privacy Center) |
| Order | Preferences → Share → Sign Out |
| Titles | `Preferences & Actions`; `Share & Refer` |
| Share row | `Share App & Refer Friends` in PrefRow card |
| Expand | Inline channel buttons; same share handlers |
| Footnote / Data Sync | Out of scope |
| Spacing | Section gap ~16px; in-card gap ~8px |

## Files

| Path | Action |
|------|--------|
| `SettingsScreen.tsx` | Swap component order |
| `ShareAppSection.tsx` | PrefRow card + inline expand |
| `SettingsPreferencesList.tsx` | Compact section spacing |
| `lib/i18n/*` | New share heading/row keys; preferences title |
| `lib/ui/settingsVisual.ts` | Share section title token |

## Success criteria

- Share block appears below Preferences with `Share & Refer` heading
- Share matches Preferences card visual language
- Three share channels work unchanged
- Compact, consistent vertical rhythm
