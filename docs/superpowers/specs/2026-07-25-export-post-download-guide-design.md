# Export Post-Download Guide — Design

**Date:** 2026-07-25  
**Status:** Approved (brainstorming)  
**Scope:** PWA local download UX — help users find exported files after Save to Phone

## 1. Problem

SnapTax is a PWA. Export uses Chrome’s download path (`<a download>`). After **Save to Phone**, files land in the browser Downloads folder. Contractors and small-business users often **cannot find the file** to attach in Gmail, Outlook, or WhatsApp.

Current Step 4 only shows one-line hints (`shareUnsupportedHint`, `savedToPhoneHint`) with no platform visuals, no copyable filename, and no structured steps.

## 2. Goals

| # | Goal |
|---|------|
| G1 | After **Save to Phone**, show **where the file went** (platform-specific) |
| G2 | Show **full filename** with **Copy** for file-manager search |
| G3 | Offer **Send to email / app** via existing `navigator.share({ files })` when supported |
| G4 | Reuse one component for **all local downloads** (tax pack, sample CSV, future exports) |
| G5 | Stay in existing **bottom sheet** — no new modal layer |

## 3. Locked decisions (brainstorming)

| Decision | Choice |
|----------|--------|
| Trigger | **Only after Save to Phone succeeds** (not on generate-ready, not auto on share) |
| Platform scope | **All platforms** — Android Chrome, iOS Safari, desktop Chrome, `other` fallback |
| UI container | **In-place in host sheet** (Step 4); **Got it** collapses; Save/Share remain |
| Collapse behavior | **Every Save re-expands** full guide (even if user dismissed before) |
| Scope | **All local downloads** via shared `PostDownloadGuide` |
| Approach | **Unified component + `downloadWithGuide()`** (not per-screen one-offs) |
| Desktop save picker | **Out of scope** v1 (`showSaveFilePicker` = phase 2) |

## 4. Architecture

```
downloadTaxPackFile(file)          // existing anchor download
       ↑ wrapped by
downloadWithGuide(file, { onDownloaded })
       ↓ synchronous after click
Host sets: guideExpanded = true, guideFile = file
       ↓
<PostDownloadGuide
  fileName={file.name}
  platform={detectExportPlatform()}
  file={file}                        // for share handler
  canShare={canShareTaxPackFile(file)}
  onShare={...}
  onDismiss={() => setGuideExpanded(false)}
/>
```

### 4.1 Modules

| Module | Responsibility |
|--------|----------------|
| `lib/export/downloadWithGuide.ts` | Trigger `<a download>`; invoke `onDownloaded({ fileName, file })` |
| `lib/export/detectExportPlatform.ts` | Return `android-chrome` \| `ios-safari` \| `desktop-chrome` \| `other` |
| `components/export/PostDownloadGuide.tsx` | Guide card UI: illustration, steps, copy row, share, got it |
| `components/export/PostDownloadPlatformIllustration.tsx` | Inline SVG per platform (no raster screenshots) |
| `lib/export/shareTaxPack.ts` | Unchanged; Share button calls existing helpers |

### 4.2 Integration points (v1)

1. `components/export/ExportEngineSheet.tsx` — Step 4 Save to Phone
2. `lib/export/downloadOnboardingSampleCsv.ts` + `SampleExportPage` / sample download buttons
3. `ExportCompletedPage` — Download again (if present)

Hosts pass `onDownloaded` and render `PostDownloadGuide` when `guideExpanded`.

## 5. UX — Step 4 layout

### 5.1 State machine

```
Step 4 (readyFile exists)
  guideExpanded = false initially (no guide until first Save)

User taps [Save to Phone]
  → downloadWithGuide(file)
  → guideExpanded = true   // always, every tap

User taps [Got it]
  → guideExpanded = false
  → [Save to Phone] and [Share] remain visible

User taps [Save to Phone] again
  → guideExpanded = true   // full guide again
```

### 5.2 Guide card (when `guideExpanded`)

Vertical order inside Export bottom sheet:

1. Existing ready header (`Your tax pack is ready` + truncated name)
2. **PostDownloadGuide card** (yellow border, zinc-900 fill)
3. **[Save to Phone]** primary yellow button
4. **[Share Tax Pack →]** secondary (unchanged)

### 5.3 Guide card contents

| Block | Content |
|-------|---------|
| Title | `FILE SAVED` |
| Illustration | Platform SVG (see §6) |
| Steps | 3 numbered bullets (i18n per platform) |
| Filename row | Full `fileName`, `break-all`, **[COPY]** button |
| Search tip | `Paste this name in your file manager search` |
| Secondary CTA | **Send to email / app** → `shareTaxPackFile` |
| Dismiss | **Got it** → `onDismiss` |

**Visual:** Black `#000` / white `#FFF` / yellow `#EAB308`; tap targets ≥64px; `active:scale-95`.

### 5.4 Copy filename

- Tap **COPY** → `navigator.clipboard.writeText(fileName)`
- Success: inline status / toast `Copied — search this name in Downloads` (3s)
- Failure: select-friendly text + `Long-press the name to copy`

### 5.5 Share secondary button

- Label: **Send to email / app** (covers Gmail, Outlook, system share sheet)
- `canShare === false`: disabled + helper `Save first, then attach from Downloads`
- On `shared`: optional status `Shared — check your email app`
- Does **not** replace Save to Phone as primary path

## 6. Platform matrix

| Platform key | Detection (v1) | Illustration | Steps (en summary) |
|--------------|----------------|--------------|-------------------|
| `android-chrome` | Android + Chrome/Chromium | Chrome toolbar, **⋮** highlighted → **Downloads** item | Tap Chrome menu **⋮** → **Downloads** → find file below |
| `ios-safari` | iOS + Safari/WebKit | Share icon → Save to Files | Tap **Share** → **Save to Files** → open **Files** app |
| `desktop-chrome` | Desktop + Chrome/Edge | Download arrow in toolbar → download bar | Click **download** icon → open from **Downloads** folder |
| `other` | Fallback | Generic folder | Check browser **Downloads** folder |

Detection: `userAgent` + optional `navigator.standalone` / `display-mode: standalone`. No brittle version checks.

## 7. i18n

New namespace: `exportEngine.postDownloadGuide` in `lib/i18n/types.ts` and en/fr/de locales.

```ts
postDownloadGuide: {
  title: string;
  copyButton: string;
  copySuccess: string;
  copyFailed: string;
  searchTip: string;
  sendToApp: string;
  sendUnsupported: string;
  sendSuccess: string;
  gotIt: string;
  steps: {
    androidChrome: string[];  // length 3
    iosSafari: string[];
    desktopChrome: string[];
    other: string[];
  };
}
```

Filename is interpolated as `{fileName}` — not translated.

## 8. Error handling & limits

| Scenario | Behavior |
|----------|----------|
| Clipboard API blocked | Show `copyFailed`; filename remains selectable |
| Share unsupported | Disable send button + `sendUnsupported` |
| Share cancelled (`AbortError`) | Silent; guide stays open |
| Double-tap Save | 300ms debounce on Save handler |
| Cannot verify download completed | Still show guide (browser provides no callback) |
| Offline local export | Same guide after Save |

**Not in scope:** read Downloads directory, `chrome.downloads` API, or post-download system notifications.

## 9. Testing

### Unit

- `detectExportPlatform.test.ts` — UA matrix → platform key
- `downloadWithGuide.test.ts` — anchor click + `onDownloaded` callback

### Component

- `PostDownloadGuide` — copy success/fail, Got it dismiss, share disabled state

### Manual QA

- Android Chrome PWA: Save → ⋮→Downloads illustration → copy → search in Files
- iOS Safari: Save → Files path
- Desktop Chrome: Save → download bar path
- Sample CSV download shows same guide

## 10. Out of scope (v1)

- `showSaveFilePicker` for desktop folder pick (phase 2)
- Auto-open Chrome Downloads page
- First-time-only guide (localStorage dismiss forever)
- `mailto:` with attachment
- Download completion OS notifications
- Analytics events (can add later under logging spec)

## 11. Implementation files (reference)

| File | Action |
|------|--------|
| `components/export/PostDownloadGuide.tsx` | Create |
| `components/export/PostDownloadPlatformIllustration.tsx` | Create |
| `lib/export/downloadWithGuide.ts` | Create |
| `lib/export/detectExportPlatform.ts` | Create |
| `components/export/ExportEngineSheet.tsx` | Modify |
| `lib/export/downloadOnboardingSampleCsv.ts` | Modify |
| `lib/i18n/types.ts`, `en-US.ts`, `fr-FR.ts`, `de-DE.ts` | Modify |
| `docs/tech/08-export.md` | Add § Post-download guide |

## 12. Canonical links

- `docs/superpowers/specs/2026-06-19-export-share-download-fix-design.md` — Save vs Share split
- `docs/superpowers/topics/export-pipeline-design.md` — Export Step 4
- `lib/export/shareTaxPack.ts` — download/share primitives
- `components/export/ExportEngineSheet.tsx` — current Step 4 UI
