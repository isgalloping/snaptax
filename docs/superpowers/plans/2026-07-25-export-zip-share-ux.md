# Export ZIP Share UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix gray/disabled Share after ZIP export by always enabling Share, attempting `navigator.share` optimistically, and showing an in-sheet File Saved guide when the OS cannot share ZIP files.

**Architecture:** Relax `shareTaxPackFile` to attempt share whenever `navigator.share` exists (ignore pre-flight `canShare` gate). Keep `canShareTaxPackFile` for hint text only. Add `deliveryView` state in `ExportEngineSheet` to swap Step 4 between ready actions and Chrome Downloads guide.

**Tech Stack:** Next.js 16 · React 19 · Web Share API · node:test (`npm run test:unit`)

**Spec:** [`docs/superpowers/specs/2026-07-25-export-zip-share-ux-design.md`](../specs/2026-07-25-export-zip-share-ux-design.md)

**Branch:** Recommend `fix/export-zip-share-ux` from `main` (or continue current branch if isolated)

## Global Constraints

- Share failure must **never** trigger automatic `<a download>` (2026-06-19 rule)
- **Save to Phone** remains explicit user action via `downloadTaxPackFile`
- Share button disabled **only** while `sharing === true` (not when `canShare` is false)
- File Saved guide is **in-sheet** Step 4 view — **no new Modal**
- i18n: EN / FR / DE for all new `exportEngine.*` keys
- `handlePreviewCsv` fallback download on `unsupported` — **unchanged**
- Visual: black `#000` / white `#FFF` / yellow `#EAB308`; min tap target ≥64px

---

## File map

| File | Action |
|------|--------|
| `lib/export/shareTaxPack.ts` | Optimistic share attempt |
| `lib/export/shareTaxPack.test.ts` | New + updated cases |
| `lib/i18n/types.ts` | New exportEngine keys |
| `lib/i18n/locales/en-US.ts` | EN copy |
| `lib/i18n/locales/fr-FR.ts` | FR copy |
| `lib/i18n/locales/de-DE.ts` | DE copy |
| `components/export/ExportEngineSheet.tsx` | `deliveryView` + guide UI |
| `docs/superpowers/topics/export-pipeline-design.md` | §3 share UX note |
| `docs/tech/08-export.md` | §8.5 update |

---

### Task 1: Optimistic share in `shareTaxPack`

**Files:**
- Modify: `lib/export/shareTaxPack.ts`
- Test: `lib/export/shareTaxPack.test.ts`

**Interfaces:**
- Produces: `shareTaxPackFile(file, title, text): Promise<ShareTaxPackResult>` — attempts share when `navigator.share` exists regardless of `canShare`
- Unchanged: `canShareTaxPackFile(file): boolean` — hint-only
- Unchanged: `downloadTaxPackFile(file): void`

- [ ] **Step 1: Add failing test — share attempted when `canShare` is false**

Add to `lib/export/shareTaxPack.test.ts`:

```typescript
  it("shareTaxPackFile attempts share when canShare is false but share exists", async () => {
    let shareCalled = false;
    await withNavigator(
      {
        canShare: () => false,
        share: async () => {
          shareCalled = true;
        },
      },
      async () => {
        const file = new File(["zip"], "SnapTax-2026-Audit-Trail.zip", {
          type: "application/zip",
        });
        const result = await shareTaxPackFile(file, "SnapTax", "Export");
        assert.equal(shareCalled, true);
        assert.equal(result, "shared");
      },
    );
  });

  it("shareTaxPackFile returns unsupported when navigator.share is missing", async () => {
    await withNavigator({ share: undefined }, async () => {
      const file = new File(["zip"], "pack.zip", { type: "application/zip" });
      const result = await shareTaxPackFile(file, "SnapTax", "Export");
      assert.equal(result, "unsupported");
    });
  });
```

- [ ] **Step 2: Run tests to verify new cases fail**

Run: `npm run test:unit -- lib/export/shareTaxPack.test.ts`

Expected: FAIL — first test returns `"unsupported"` without calling `share`; second may already pass.

- [ ] **Step 3: Implement optimistic share**

Replace `shareTaxPackFile` in `lib/export/shareTaxPack.ts`:

```typescript
export async function shareTaxPackFile(
  file: File,
  title: string,
  text: string,
): Promise<ShareTaxPackResult> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return "unsupported";
  }
  try {
    await navigator.share({ files: [file], title, text });
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return "cancelled";
    }
    return "failed";
  }
}
```

- [ ] **Step 4: Update existing test that expected unsupported when canShare false**

Change `shareTaxPackFile returns unsupported when canShare is false` to expect `"shared"` (share is called) OR delete it as redundant with the new optimistic test. Keep `canShareTaxPackFile uses navigator.canShare when available` — `canShareTaxPackFile` behavior unchanged.

- [ ] **Step 5: Run tests**

Run: `npm run test:unit -- lib/export/shareTaxPack.test.ts`

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add lib/export/shareTaxPack.ts lib/export/shareTaxPack.test.ts
git commit -m "fix(export): attempt navigator.share even when canShare is false"
```

---

### Task 2: i18n keys for File Saved guide

**Files:**
- Modify: `lib/i18n/types.ts`
- Modify: `lib/i18n/locales/en-US.ts`
- Modify: `lib/i18n/locales/fr-FR.ts`
- Modify: `lib/i18n/locales/de-DE.ts`

**Interfaces:**
- Produces: new `exportEngine` string keys consumed by `ExportEngineSheet`

- [ ] **Step 1: Extend `UserCopy.exportEngine` in `lib/i18n/types.ts`**

Add after `savedToPhoneHint`:

```typescript
    fileSavedTitle: string;
    fileSavedChromeStep1: string;
    fileSavedChromeStep2: string;
    fileSavedChromeStep3: string;
    fileSavedCopy: string;
    fileSavedCopied: string;
    fileSavedCopyFailed: string;
    fileSavedGotIt: string;
    shareMayNeedDownloadsHint: string;
```

- [ ] **Step 2: Add EN copy in `lib/i18n/locales/en-US.ts`**

Inside `exportEngine`:

```typescript
      fileSavedTitle: "FILE SAVED",
      fileSavedChromeStep1: "Open Chrome menu (top right)",
      fileSavedChromeStep2: "Tap Downloads",
      fileSavedChromeStep3: "Find your file below",
      fileSavedCopy: "COPY",
      fileSavedCopied: "Copied",
      fileSavedCopyFailed: "Copy failed — long-press the filename to copy",
      fileSavedGotIt: "Got it",
      shareMayNeedDownloadsHint:
        "If Share doesn't open, save to phone and attach from Downloads.",
```

- [ ] **Step 3: Add FR copy in `lib/i18n/locales/fr-FR.ts`**

```typescript
      fileSavedTitle: "FICHIER ENREGISTRÉ",
      fileSavedChromeStep1: "Ouvrez le menu Chrome (en haut à droite)",
      fileSavedChromeStep2: "Appuyez sur Téléchargements",
      fileSavedChromeStep3: "Trouvez votre fichier ci-dessous",
      fileSavedCopy: "COPIER",
      fileSavedCopied: "Copié",
      fileSavedCopyFailed: "Échec de la copie — appui long sur le nom du fichier",
      fileSavedGotIt: "Compris",
      shareMayNeedDownloadsHint:
        "Si Partager ne s'ouvre pas, enregistrez sur le téléphone et joignez depuis Téléchargements.",
```

- [ ] **Step 4: Add DE copy in `lib/i18n/locales/de-DE.ts`**

```typescript
      fileSavedTitle: "DATEI GESPEICHERT",
      fileSavedChromeStep1: "Chrome-Menü öffnen (oben rechts)",
      fileSavedChromeStep2: "Auf Downloads tippen",
      fileSavedChromeStep3: "Datei unten finden",
      fileSavedCopy: "KOPIEREN",
      fileSavedCopied: "Kopiert",
      fileSavedCopyFailed: "Kopieren fehlgeschlagen — Dateiname lange drücken",
      fileSavedGotIt: "Verstanden",
      shareMayNeedDownloadsHint:
        "Wenn Teilen nicht öffnet, auf dem Handy speichern und aus Downloads anhängen.",
```

- [ ] **Step 5: Typecheck**

Run: `npm run lint` (or `npx tsc --noEmit` if lint noisy — ensure locale objects satisfy `UserCopy`)

- [ ] **Step 6: Commit**

```bash
git add lib/i18n/types.ts lib/i18n/locales/en-US.ts lib/i18n/locales/fr-FR.ts lib/i18n/locales/de-DE.ts
git commit -m "feat(i18n): add export File Saved guide strings"
```

---

### Task 3: ExportEngineSheet delivery views

**Files:**
- Modify: `components/export/ExportEngineSheet.tsx`

**Interfaces:**
- Consumes: `shareTaxPackFile`, `canShareTaxPackFile`, `downloadTaxPackFile` from `@/lib/export/shareTaxPack`
- Consumes: new `exportEngine.*` i18n keys from Task 2

- [ ] **Step 1: Add state and reset helpers**

Near existing `readyFile` state:

```typescript
type DeliveryView = "ready" | "fileSavedGuide";

const [deliveryView, setDeliveryView] = useState<DeliveryView>("ready");
const [copyHint, setCopyHint] = useState<string | null>(null);
```

In `handleGenerate` start (where `setReadyFile(null)`):

```typescript
setDeliveryView("ready");
setCopyHint(null);
```

When sheet closes (`onClose` handler path) — reset in an effect or wrap `onClose`:

```typescript
useEffect(() => {
  if (!open) {
    setDeliveryView("ready");
    setCopyHint(null);
  }
}, [open]);
```

If component unmounts on close, reset in `onClose` callback before calling parent `onClose`.

- [ ] **Step 2: Update `handleShare`**

```typescript
  const handleShare = async (file: File) => {
    setSharing(true);
    setShareStatus(null);
    setCopyHint(null);
    try {
      const result = await shareTaxPackFile(
        file,
        exportShareTitle(taxYear),
        copy.settings.export.shareText,
      );
      if (result === "unsupported" || result === "failed") {
        setDeliveryView("fileSavedGuide");
      } else if (result === "cancelled") {
        setShareStatus(t.sharingHint);
      }
    } finally {
      setSharing(false);
    }
  };
```

Remove setting `shareStatus` to `shareUnsupportedHint` / `shareFailedHint` on ready view (guide replaces those).

- [ ] **Step 3: Add copy filename helper**

```typescript
  const handleCopyFilename = async (filename: string) => {
    setCopyHint(null);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(filename);
      } else {
        const ta = document.createElement("textarea");
        ta.value = filename;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopyHint(t.fileSavedCopied);
    } catch {
      setCopyHint(t.fileSavedCopyFailed);
    }
  };
```

- [ ] **Step 4: Update ready-view hint line**

Replace status line logic (~732–738):

```typescript
{sharing
  ? t.sharing
  : shareStatus ??
    (readyFile && canShareTaxPackFile(readyFile)
      ? t.sharingHint
      : t.shareMayNeedDownloadsHint)}
```

- [ ] **Step 5: Enable Share button — remove canShare disable**

```typescript
disabled={sharing}
```

- [ ] **Step 6: Render `fileSavedGuide` inside Step 4 when `deliveryView === "fileSavedGuide"`**

Replace the `readyFile ? (...)` block structure:

```tsx
) : readyFile ? (
  deliveryView === "fileSavedGuide" ? (
    <div className="py-4 text-center">
      <p className="text-sm font-black uppercase tracking-wider text-yellow-400">
        {t.fileSavedTitle}
      </p>
      <ol className="mx-auto mt-4 max-w-xs space-y-2 text-left text-xs text-zinc-300">
        <li>1. {t.fileSavedChromeStep1}</li>
        <li>2. {t.fileSavedChromeStep2}</li>
        <li>3. {t.fileSavedChromeStep3}</li>
      </ol>
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 py-3">
        <span className="min-w-0 truncate text-xs font-bold text-zinc-200">
          {readyFile.name}
        </span>
        <button
          type="button"
          onClick={() => void handleCopyFilename(readyFile.name)}
          className="shrink-0 min-h-11 rounded-lg border-2 border-zinc-500 px-3 text-xs font-black uppercase text-white active:scale-95"
        >
          {t.fileSavedCopy}
        </button>
      </div>
      {copyHint && (
        <p className="mt-2 text-xs text-zinc-400" role="status">
          {copyHint}
        </p>
      )}
      <button
        type="button"
        onClick={() => setDeliveryView("ready")}
        className="mt-6 w-full min-h-14 rounded-xl border-2 border-zinc-600 bg-zinc-800 py-3 text-sm font-black uppercase tracking-wider text-white active:scale-95"
      >
        {t.fileSavedGotIt}
      </button>
    </div>
  ) : (
    /* existing ready view with Save + Share buttons */
  )
) : null}
```

Keep existing ready block (green ready text, Save to Phone, Share) inside the `else` branch.

- [ ] **Step 7: Manual smoke**

Run: `npm run dev` → Settings → Export → `cpa_pack` → Generate → confirm Share is **not** gray; tap Share on desktop (may show guide or native share).

- [ ] **Step 8: Commit**

```bash
git add components/export/ExportEngineSheet.tsx
git commit -m "feat(export): File Saved guide when ZIP share unavailable"
```

---

### Task 4: Docs + regression

**Files:**
- Modify: `docs/superpowers/topics/export-pipeline-design.md`
- Modify: `docs/tech/08-export.md`

- [ ] **Step 1: Append to export-pipeline topic**

Add subsection under share / Step 4:

```markdown
### 3.x Share delivery UX (2026-07-25)

- Share button always tappable when `readyFile` exists (`sharing` only disables).
- `shareTaxPackFile` attempts `navigator.share` whenever API exists (ignores pre-flight `canShare`).
- `unsupported` / `failed` → in-sheet **File Saved guide** (Chrome Downloads + COPY filename).
- Share failure never auto-downloads (2026-06-19).
```

- [ ] **Step 2: Update `docs/tech/08-export.md` §8.5**

Replace gate comment to note Share is always attempted; add File Saved guide fallback for ZIP on Android.

- [ ] **Step 3: Run full unit suite**

Run: `npm run test:unit`

Expected: all pass (including `shareTaxPack.test.ts`)

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/topics/export-pipeline-design.md docs/tech/08-export.md
git commit -m "docs(export): document ZIP share fallback guide UX"
```

---

## Manual QA checklist (post-implementation)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Android Chrome, `cpa_pack`, `canShare` false | Share enabled; tap → guide or system sheet |
| 2 | Share fails | File Saved guide + COPY works |
| 3 | Save to Phone | Download once; Share fail does not re-download |
| 4 | CSV, `canShare` true | Native share sheet |
| 5 | Cancel share sheet | Stay on ready, `sharingHint` |
| 6 | Preview CSV, unsupported | Still downloads (unchanged) |

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Share always tappable | Task 3 Step 5 |
| Optimistic share attempt | Task 1 |
| File Saved guide | Task 3 Step 6 |
| No auto-download on share fail | Task 1 + 3 (handleShare) |
| i18n EN/FR/DE | Task 2 |
| Clipboard copy + fallback | Task 3 Step 3 |
| Reset deliveryView on regenerate/close | Task 3 Step 1 |
| Docs | Task 4 |
| Preview CSV unchanged | No changes to `handlePreviewCsv` |

No placeholders. Type names consistent (`DeliveryView`, `ShareTaxPackResult`).
