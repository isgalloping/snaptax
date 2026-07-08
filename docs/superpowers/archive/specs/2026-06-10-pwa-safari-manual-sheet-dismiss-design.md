# PWA Safari Manual Sheet Dismiss — Design

**Date:** 2026-06-10  
**Status:** Approved  
**Problem:** macOS Safari — Manual install sheet opens, but **Got it** and header download feel unresponsive (no visual feedback). Reproduced in local dev.

**Builds on:** `2026-06-10-pwa-manual-install-ack-design.md`, `2026-06-10-pwa-cross-context-installed-design.md`

## Root cause (likely)

| # | Issue |
|---|--------|
| 1 | `InstallManualSheet` uses single-layer `fixed inset-0` flex bottom sheet at `z-[60]` — Safari hit-testing unreliable vs dev overlays / bottom install bar |
| 2 | `install()` awaits `isPwaInstalledOnDevice()` before opening manual sheet — can block Safari manual path |
| 3 | `acknowledgeManualSheet()` calls `sync()` inline — defer to next frame to avoid Safari state batching edge cases |

Sheet **can** open → React state works; **Got it** does not close → dismiss handler or click delivery failure.

## Fix (approach B)

### InstallManualSheet

- Raise to `z-[100]`
- Split backdrop (clickable dismiss) + panel (`stopPropagation` on pointer down)
- `role="dialog"` + `aria-modal="true"`
- Escape key closes sheet
- Got it: `onClick` + `onPointerUp` both call `onClose`

### PwaInstallProvider

- **Safari / manual platforms:** `install()` opens sheet synchronously (no upfront `await`)
- **Chromium:** keep `await isPwaInstalledOnDevice()` + `beforeinstallprompt` flow
- **Got it:** `setManualSheetOpen(false)` + `dismissInstallBar()` then `requestAnimationFrame(() => void sync())`

## Product behavior (unchanged)

- Got it = acknowledge steps + dismiss bar → header button only
- Safari cannot auto-install; user follows Share → Add to Dock steps
- macOS manual copy unchanged

## Acceptance (local macOS Safari)

1. Bottom bar **How to add** or header download → sheet opens
2. **Got it** → sheet closes; bottom bar gone; header download remains
3. Backdrop tap → same as Got it
4. Escape → sheet closes
5. Header download → sheet opens without delay/hang

## Non-goals

- One-click install on Safari
- Portal to `document.body`
- Changing install step copy

## Decision log

| Date | Decision |
|------|----------|
| 2026-06-10 | Approach B: modal restructure + Safari sync open/dismiss |
| 2026-06-10 | Local dev testing environment noted (Next.js dev overlay) |
