# Export ZIP Share UX — Design

**Status:** Approved (brainstorming §1–§2)  
**Date:** 2026-07-25  
**Builds on:** [2026-06-19 export share/download fix](../archive/specs/2026-06-19-export-share-download-fix-design.md) · [export-pipeline-design.md](../topics/export-pipeline-design.md) §3 share  
**Scope:** ExportEngineSheet Step 4 — Audit Trail ZIP (and all formats) share/delivery UX on Android Chrome / PWA

---

## 1. Problem

After generating `SnapTax-{year}-Audit-Trail.zip` (`cpa_pack`), users on Android Chrome / WebAPK see **Share / Send to Email / App disabled (gray)** and cannot complete the “email my CPA” workflow.

**Root cause (confirmed):** Not a runtime crash — the Share button is intentionally disabled when `canShareTaxPackFile(readyFile)` is false. For `application/zip`, Android Chrome commonly returns false from `navigator.canShare({ files })` (and the no-`canShare` fallback only allows `text/*` and `application/pdf`).

**UX gap:** A visible but disabled Share CTA feels broken. Users who already tapped **Save to Phone** still need guidance to attach from Downloads — there is no in-sheet guide today in shipped UI.

**In scope symptom:** User report **A** — button gray / not clickable.

---

## 2. Goals

| Goal | Detail |
|------|--------|
| **No dead Share CTA** | When `readyFile` exists, Share is tappable (only disabled while `sharing === true`) |
| **Try share when possible** | Attempt `navigator.share({ files })` when API exists, even if `canShare` was false |
| **Graceful fallback** | On `unsupported` / `failed`, show in-sheet **File Saved guide** (Chrome → Downloads → attach) |
| **Keep 2026-06-19 rule** | Share failure must **never** trigger automatic `<a download>` |
| **Save to Phone unchanged** | Explicit download remains primary CTA for ZIP |
| **i18n** | EN / FR / DE copy for guide + button labels |

---

## 3. Non-goals

- Server-side email of ZIP attachments
- `mailto:` with attachment (not possible on web)
- File System Access / native Android intents beyond Web Share API
- Changing ZIP build pipeline or export entitlement gates
- Marketing-site export flows

---

## 4. Interaction design (§1 — approved)

### 4.1 Step 4 states

```text
generateStep (building…) → ready (file in memory) ⇄ fileSavedGuide
```

| View | When | Primary actions |
|------|------|-----------------|
| **ready** | `readyFile` set, guide not shown | **Save to Phone** (yellow) · **Share Tax Pack →** (always enabled*) |
| **fileSavedGuide** | Share returned `unsupported` or `failed`; or no `navigator.share` | Chrome menu illustration · filename · **Copy** · **Got it** |

\*Disabled only while `sharing === true`.

### 4.2 Share click flow

```text
User taps Share
  → sharing = true
  → shareTaxPackFile(readyFile, …)
       → shared: stay on ready, clear hint / optional success line
       → cancelled: stay on ready, hint "Tap Share again if you dismissed the sheet"
       → unsupported | failed: set view = fileSavedGuide (do NOT download)
  → sharing = false
```

### 4.3 Save to Phone flow

Unchanged: `downloadTaxPackFile(readyFile)` + hint. Optional enhancement: after Save, user may still tap Share (file remains in memory).

### 4.4 File Saved guide content (matches product mock)

- Title: **FILE SAVED**
- 3-step Chrome hint: menu (⋮) → Downloads → find file below
- Filename chip: `SnapTax-{year}-Audit-Trail.zip` + **COPY** (clipboard)
- Secondary: **Got it** → back to `ready` view (or close sheet — implement as back to `ready` so user can Share again)
- Do **not** show a second disabled Share button on guide view

### 4.5 Hint copy on ready view (before share attempt)

- If `canShareTaxPackFile(readyFile)`: existing `sharingHint`
- Else: softer pre-hint e.g. “If Share doesn’t open, use Save to Phone and attach from Downloads” (i18n key `shareMayNeedDownloadsHint`)

---

## 5. Technical design (§2)

### 5.1 `lib/export/shareTaxPack.ts`

| Function | Change |
|----------|--------|
| `canShareTaxPackFile` | **Keep** for hint / analytics only; **no longer** gates button disabled state |
| `shareTaxPackFile` | If `navigator.share` missing → `unsupported`. Else **always attempt** `navigator.share({ files })` even when `canShare` is false or throws. Preserve `AbortError` → `cancelled`. |
| `downloadTaxPackFile` | No change |

Add unit tests:

- Attempts share when `canShare` returns false but `share` exists
- Returns `unsupported` when `navigator.share` undefined

### 5.2 `components/export/ExportEngineSheet.tsx`

- Add `deliveryView: 'ready' | 'fileSavedGuide'` state (default `ready`)
- Remove `disabled={!canShareTaxPackFile(readyFile)}` from Share button
- On share `unsupported` / `failed` → `setDeliveryView('fileSavedGuide')`
- Render `fileSavedGuide` block inside Step 4 (same sheet, no new Modal)
- **Copy filename:** `navigator.clipboard.writeText(readyFile.name)` with fallback `execCommand` if needed; toast/hint “Copied”
- Reset `deliveryView` to `ready` when new generate starts or sheet closes

### 5.3 i18n (`lib/i18n/types.ts`, `en-US`, `fr-FR`, `de-DE`)

New keys under `exportEngine`:

| Key | EN (draft) |
|-----|------------|
| `fileSavedTitle` | FILE SAVED |
| `fileSavedChromeStep1` | Open Chrome menu (top right) |
| `fileSavedChromeStep2` | Tap Downloads |
| `fileSavedChromeStep3` | Find your file below |
| `fileSavedCopy` | COPY |
| `fileSavedCopied` | Copied |
| `fileSavedGotIt` | Got it |
| `shareMayNeedDownloadsHint` | If Share doesn’t open, save to phone and attach from Downloads. |

Reuse existing `share`, `saveToPhone`, `shareFailedHint` where applicable.

### 5.4 Docs

- Append §3.x to `docs/superpowers/topics/export-pipeline-design.md` (share UX + fileSavedGuide)
- Short note in `docs/tech/08-export.md` §8.5: Share button always tappable; ZIP fallback guide

---

## 6. Error handling

| Case | Behavior |
|------|----------|
| `navigator.share` absent | Share tap → `unsupported` → fileSavedGuide |
| `canShare` false, `share()` throws | `failed` → fileSavedGuide |
| User cancels share sheet | Stay on ready, `sharingHint` |
| Clipboard denied | Show inline “Copy failed — long-press filename” |
| Large ZIP share rejected by OS | fileSavedGuide; user uses Save to Phone path |

Never auto-download on share failure (regression guard from 2026-06-19).

---

## 7. Testing

### 7.1 Unit (`lib/export/shareTaxPack.test.ts`)

- Share attempted when `canShare: () => false` and `share` resolves
- `unsupported` when no `navigator.share`

### 7.2 Component / manual QA

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Android Chrome, `cpa_pack` ZIP, `canShare` false | Share **enabled**; tap → guide or share sheet |
| 2 | Share fails | fileSavedGuide with filename + COPY |
| 3 | Save to Phone | File in Downloads; no duplicate download on Share fail |
| 4 | CSV export, `canShare` true | Native share sheet opens |
| 5 | PWA standalone WebAPK | Same as browser tab |
| 6 | User cancels share | Returns to ready, no guide |

---

## 8. Files to change

| File | Action |
|------|--------|
| `lib/export/shareTaxPack.ts` | Optimistic share attempt |
| `lib/export/shareTaxPack.test.ts` | New cases |
| `components/export/ExportEngineSheet.tsx` | deliveryView + guide UI |
| `lib/i18n/types.ts` | New keys |
| `lib/i18n/locales/en-US.ts` | Copy |
| `lib/i18n/locales/fr-FR.ts` | Copy |
| `lib/i18n/locales/de-DE.ts` | Copy |
| `docs/superpowers/topics/export-pipeline-design.md` | Topic update |
| `docs/tech/08-export.md` | §8.5 note |

---

## 9. Rollout / risk

- **Low risk:** Client-only UX; no API or billing changes
- **Regression watch:** Ensure preview CSV path still downloads on `unsupported` (ExportEngineSheet `handlePreviewCsv` — unchanged behavior)
- **Platform ceiling:** Large ZIP may still fail OS share; guide is the intended fallback
