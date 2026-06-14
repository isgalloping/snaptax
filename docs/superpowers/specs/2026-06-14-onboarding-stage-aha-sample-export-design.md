# Onboarding — Remove Stage 4 Google + Sample Export Design

**Date:** 2026-06-14  
**Status:** Approved  
**Amends:**
- [`2026-06-14-onboarding-optional-signup-design.md`](./2026-06-14-onboarding-optional-signup-design.md) — removes stage_4 Google Sheet
- [`2026-06-14-onboarding-aha-coach-highlights-design.md`](./2026-06-14-onboarding-aha-coach-highlights-design.md) — coach phase uses `stage_aha`

**Brainstorming approved:** 2026-06-14 — Option B (`stage_aha` coach) + Option D (local sample CSV, export completes onboarding).

---

## 1. Problem

After sandbox snap, auto `stage_4` Google Sheet interrupts the Aha moment. Users should explore tax saved / demo receipt / export on the main screen first. Export during coach should deliver **sample data** without login or paywall.

---

## 2. Decisions

| Topic | Choice |
|-------|--------|
| Google Sheet after Aha | **Removed** |
| Post-Aha phase | New **`stage_aha`** (coach halos, no sheet) |
| Coach halos | Only during `stage_aha` |
| Export in `stage_aha` | Local `buildLocalTurboTaxCsv` with demo receipt; `downloadTaxPackFile` |
| Export success | → `completed` |
| Coach dismiss (tax/receipt tap) | → `completed` |
| Export button tap | Download sample then `completed` (not dismiss-before-export) |
| SNAP in `stage_aha` | **Allowed** (real camera) |
| Legacy `stage_4` in IDB | Migrate to `stage_aha` on read |
| Normal export after `completed` | Unchanged (no demo, gates apply) |

---

## 3. State machine

```text
stage_2 → stage_3 (Aha ~600ms) → stage_aha → completed
```

| Event | Transition |
|-------|------------|
| Aha animation end | `stage_3` → `stage_aha` |
| Sample export | `stage_aha` → `completed` |
| Coach dismiss | `stage_aha` → `completed` |
| Legacy `stage_4` read | → `stage_aha` |

---

## 4. Sample export

- File: `Snap1099-SAMPLE-TurboTax-{year}.csv`
- Data: single `isOnboardingDemo && status === done` receipt
- Uses `defaultExportTaxYear()` + `clientTimeZone()`

---

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-1 | No Google Sheet after sandbox |
| AC-2 | `stage_aha` shows coach halos |
| AC-3 | Export downloads sample CSV without gates |
| AC-4 | Export or dismiss → `completed` |
| AC-5 | Post-`completed` export uses normal gate |
