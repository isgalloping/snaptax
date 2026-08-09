# 1099 Income Capture — Return to List + Two-Phase Feedback — Design

**Date:** 2026-08-09  
**Status:** Approved (brainstorming + grilling)  
**Scope:** Post-capture UX when user taps Snap 1099-NEC / Snap 1099-K from Settings or Export Engine

---

## Problem

From Settings (or Export Engine), tapping **Snap 1099-NEC/K** opens the shared **batch** camera. After capture:

- Camera close returns to **Settings** (`cameraReturnViewRef = "settings"`), not the receipt list
- User must manually finish batch session (Done) — easy to get stuck in camera
- No 1099-specific feedback; user cannot tell if capture succeeded

---

## Goals

| Requirement | Detail |
|-------------|--------|
| Landing page | After **successful** capture → **home receipt list** (all entry points) |
| Cancel | Close camera without shutter → **stay on source page** (Settings or Export) |
| Camera mode | **Single shot** for 1099 intent — shutter → save → close |
| Feedback | **Two-phase** banner + row highlight (reuse `receiptNotice` pattern) |
| Persistence | Write `captureKind` on `StoredReceipt` at capture time |
| Duplicate | Reuse existing duplicate notice + scroll |

---

## Grilling decisions (locked)

1. Success landing: always home list  
2. Feedback: phase 1 immediate + phase 2 terminal (done / blurry)  
3. Camera: single-shot for 1099 intent  
4. Cancel without shot: remain on source  
5. Phase 2 success: `{form} · {amount} from {payer}` (payer optional)  
6. Phase 2 blurry: `Couldn't read {form} — tap to resnap` + highlight  
7. Duplicate: existing flow  
8. `captureKind` on receipt at capture  

---

## User flow

```
Settings/Export → Snap 1099-NEC
  → setPendingIncomeCapture + openIncomeCapture(kind)
  → camera (single-shot)
  → [cancel] → stay on source
  → [shutter] → IDB row (processing, captureKind) → close → home
  → phase 1 banner + highlight new row
  → [watcher] done → phase 2 success banner
  → [watcher] blurry → phase 2 resnap banner
```

Export Engine: sheet still closes before camera (existing); after capture user lands on **home**, not Export wizard.

---

## Implementation

### Navigation

- `openIncomeCapture(kind)` sets `incomeCaptureIntentRef.current = kind`
- On successful `handleCapture` when intent active:
  - Set `cameraReturnViewRef = "home"` before camera closes
  - `setView("home")` via existing `viewAfterCameraClose`
- On camera cancel with zero shots: keep original `returnView` (settings / home)

### Camera mode

- When `incomeCaptureIntentRef` is set, SnapButton uses **single** shot path (`handleSingleShot` → close camera immediately after `onCapture`)
- Do not enter batch defer / batch review for 1099 intent

### captureKind persistence

- On capture with active intent: set `receipt.captureKind` on `StoredReceipt` before save
- Clear `sessionStorage` pending kind after binding to row (upload may still consume pending as fallback; row field is source of truth)

### Two-phase feedback (`HomeScreen`)

Track `pendingIncomeFeedback: { receiptId, kind } | null`.

| Phase | Trigger | Banner | List |
|-------|---------|--------|------|
| 1 | Capture success | `{form} added · Scanning…` | Insert row, scroll + highlight |
| 2 done | Receipt `done` + income category | `{form} · {amount} from {payer?}` | Renew highlight, reset 4s timer |
| 2 blurry | `status === "blurry"` | `Couldn't read {form} — tap to resnap` | Highlight blurry row |
| Duplicate | `prepareReceiptCapture` duplicate | Existing duplicate copy | Scroll to existing id, home |

Pure copy helpers in `lib/client/incomeCaptureFeedback.ts`.

### i18n

New keys under `home.incomeCapture`:

- `phase1Scanning`: `{form} added · Scanning…`
- `phase2Success`: `{form} · {amount} from {payer}` / `{form} · {amount} saved` when no payer
- `phase2Blurry`: `Couldn't read {form} — tap to resnap`

EN-US first; FR/DE can mirror in follow-up.

---

## Files

| File | Change |
|------|--------|
| `components/home/HomeScreen.tsx` | Intent ref, navigation override, feedback watcher |
| `components/home/SnapButton.tsx` | Single-shot when income intent prop/ref |
| `lib/client/prepareReceiptCapture.ts` or capture handler | Optional `captureKind` param |
| `lib/client/incomeCaptureFeedback.ts` | Banner copy builders |
| `lib/client/incomeCaptureFeedback.test.ts` | Unit tests |
| `lib/i18n/types.ts`, `en-US.ts` | Copy keys |
| `lib/client/cameraReturnNavigation.ts` | Document success-home override (logic may live in HomeScreen) |

**Out of scope:** Vision model changes, new receipt status, Settings inline list.

---

## Testing

| Type | Case |
|------|------|
| Unit | Feedback copy with/without payer; blurry template |
| Manual | Settings → 1099-NEC → one shutter → home + phase 1 |
| Manual | Wait for done → phase 2 amount |
| Manual | Blurry image → phase 2 resnap |
| Manual | Cancel camera → still Settings |
| Manual | Export entry → capture → home (sheet closed) |
| Manual | Duplicate photo → duplicate banner + existing row |

---

## Success criteria

- [ ] Single shutter closes camera and shows home receipt list
- [ ] Phase 1 banner within 1s of capture
- [ ] Phase 2 updates on done/blurry without user action
- [ ] Cancel without capture does not leave Settings/Export
- [ ] `captureKind` survives offline until upload

---

## Risks

| Risk | Mitigation |
|------|------------|
| Single-shot vs batch code paths diverge | Intent flag only on 1099 entry; normal SNAP unchanged |
| Phase 2 never fires offline | Phase 1 still confirms capture; list row shows processing |
| Export user expects return to wizard | Product choice: home list first; Export Again from Settings |
