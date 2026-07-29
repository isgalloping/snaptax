# Resnap Shutter Footer Consistency — Design

**Date:** 2026-06-18  
**Status:** Approved (brainstorming)  
**Scope:** Unify blurry-receipt resnap (`mode="single"`) camera footer with Snap live footer shutter styling.

**Supersedes (partial):** `docs/superpowers/specs/2026-06-10-camera-live-footer-ui-design.md` §Wiring — single mode no longer uses bare centered `full` shutter.

---

## Summary

Resnap opens `CameraOverlay` in `single` mode with a smaller 72px shutter and no footer dock. Snap batch live uses `CameraLiveFooter` with 96px hero shutter inside `footerDock`. Extract shared **`CameraShutterFooter`** (dock + hero shutter + label) for both paths.

---

## Decisions

| Topic | Choice |
|-------|--------|
| Footer layout (single) | **A** — same `footerDock` chrome; center hero shutter only; no BATCH/DONE columns |
| Shutter size | `size="hero"` (96px) |
| Behavior | Unchanged — single shot then close |
| Implementation | New `CameraShutterFooter`; `CameraLiveFooter` reuses center column |

---

## Components

| File | Role |
|------|------|
| `CameraShutterFooter.tsx` | `footerDock` wrapper + `CameraShutterControl size="hero"` + i18n label |
| `CameraLiveFooter.tsx` | Center column delegates to `CameraShutterFooter` |
| `CameraOverlay.tsx` | `mode === "single"` renders `CameraShutterFooter` instead of bare control |

---

## Acceptance

1. Blurry resnap footer matches Snap hero shutter + black dock + TAKE PHOTO label.
2. Batch Snap footer unchanged visually.
3. Single mode still one-shot auto-close; no batch/done controls.
4. Shutter cooldown arc works in both modes.
