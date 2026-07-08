# Settings Google Button & Page Background — Design

**Date:** 2026-06-19  
**Status:** Approved (design)  
**References:** `docs/ui/snaptax-settings-bg-ui-v2.png` · user-provided Continue with Google mock  
**Scope:** Settings page full-bleed background; unsigned-only white Google CTA; signed-in profile unchanged; sub-pages share shell.

## Summary

Apply carpenter/tools wood photo as the Settings page background (main + all viewState sub-pages). Replace the unsigned account block yellow Google CTA with a white button matching Google brand layout (G logo + uppercase label). Signed-in account UI, GoogleSignInSheet GIS button, and other app Google entry points stay unchanged.

## Locked decisions

| Topic | Choice |
|-------|--------|
| White Google button | **Unsigned Settings account only** |
| Signed-in profile | **Unchanged** (v5 initials + name + email + Paid) |
| Background scope | **Entire Settings shell** — main + sub-pages (Language, Industry, export flow, etc.) |
| Asset path | `docs/ui/snaptax-settings-bg-ui-v2.png` → `public/photo/settings-bg.png` |
| GoogleSignInSheet | **Unchanged** — GIS official button inside sheet |
| Header | Semi-transparent over photo (`bg-black/50 backdrop-blur-sm`) |

## Architecture

```
SettingsPageShell (new)
├── fixed bg: settings-bg.png cover center
├── overlay gradient (main vs sub-page depth)
└── z-10 content column
    ├── SettingsHeader (translucent)
    └── scroll body

SettingsAccountBlock (unsigned)
├── NOT SIGNED IN headline (+ text shadow)
└── ContinueWithGoogleButton → onSignIn → GoogleSignInSheet

SettingsSubPageShell → wraps children in SettingsPageShell subPage variant
SettingsScreen main → SettingsPageShell
```

## Visual spec

### Page background

- Image: `bg-cover bg-center bg-no-repeat`
- Main overlay: `rgba(0,0,0,0.65)` + bottom gradient to `#000`
- Sub-page overlay: slightly darker (`0.75`) for list readability

### ContinueWithGoogleButton

- White `#FFFFFF` full-width, `rounded-xl`, `min-h-16`
- Left: official 4-color Google G SVG (24px)
- Label: i18n `settings.account.googleCta`, `text-zinc-800 font-black uppercase tracking-wider`
- `active:scale-95`

## Files

| Path | Action |
|------|--------|
| `public/photo/settings-bg.png` | **New** (copy from docs) |
| `components/settings/SettingsPageShell.tsx` | **New** |
| `components/auth/ContinueWithGoogleButton.tsx` | **New** |
| `lib/ui/settingsVisual.ts` | page bg tokens |
| `components/settings/SettingsScreen.tsx` | use shell on main |
| `components/settings/SettingsSubPageShell.tsx` | use shell on sub-pages |
| `components/settings/SettingsHeader.tsx` | translucent header |
| `components/settings/SettingsAccountBlock.tsx` | white Google button |

## Out of scope

- SampleExportPage Continue with Google styling
- Home / Onboarding Google CTAs
- GIS renderButton theme changes

## Testing

1. Unsigned Settings: wood bg visible; white Google button with G logo; tap opens sheet
2. Signed-in Settings: same bg; profile block unchanged
3. Language/Industry sub-pages: same bg, readable lists
4. EN/FR/DE button label via i18n

## Success criteria

- Settings feels cohesive with photo background on all in-page routes
- Unsigned Google CTA matches reference (white + G + uppercase text)
- No regression in sign-in flow or signed-in account display
