# PWA Manual Install Ack — Design

**Date:** 2026-06-10  
**Status:** Approved  
**Problem:** Bottom bar Install → Manual sheet → Got it closes sheet but **bottom bar remains** → Install again → infinite loop. Got it does not install (manual path only).

## Root cause

| Step | Bug |
|------|-----|
| Install (no `beforeinstallprompt`) | Opens manual sheet ✓ |
| Got it | Only `setManualSheetOpen(false)` — **mode stays `bar`** |
| Install again | Sheet reopens → **死循环** |

Got it cannot trigger install on Safari / no-bip Chromium — user must use browser menu.

## Fix

1. **Got it = acknowledge manual path** → call `dismissInstallBar()` → switch to **header-button** mode (same as Not now).
2. **Bottom bar primary label:** `Install` when native prompt available; **`How to add`** when not — sets expectations.
3. **Manual sheet lead copy:** Explicit that browser cannot auto-install.

## Flow after fix

```
bar → How to add / Install → manual sheet → Got it → header button only
header Install → manual sheet → Got it → sheet closes (already header mode)
installed → none
```

## Non-goals

- Auto-install without browser menu on Safari
- Re-show bottom bar after Got it
