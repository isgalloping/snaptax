# HVAC Hero Composite Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enlarge the HVAC SEO hero’s three-phone composite so the right visual column is balanced with the left copy, with the worker photo as a small bottom-left overlay — without changing the electrician hero.

**Architecture:** Add optional `hero.visualLayout: "stacked" | "composite"` (default stacked when omitted). HVAC sets `"composite"`. `IndustryHero` branches layout/CSS only for composite; re-export the mobile PNG to ~1200w at the existing path.

**Tech Stack:** Next.js App Router, React, Tailwind 4, sharp (asset optimize), node:test

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-09-hvac-hero-composite-layout-design.md`
- HVAC only via explicit `visualLayout: "composite"` — no `slug === "hvac"` hardcode
- Electrician omits `visualLayout` → keep side-by-side stacked layout
- Composite: phone full width of right column; worker overlay ~28–34% width, bottom-left inset
- Desktop composite grid ~ `1fr | 1fr`; stacked keeps current `1.1fr | 0.9fr`
- Narrow screens: same composite + overlay; phone `w-full`
- Runtime path stays `/marketing/seo/hvac-tax-deductions-snaptax-mobile.png` (~1200w)
- Do not change SEO copy, other sections, or electrician defaults
- Source for re-export: `docs/seo/hvac/hvac.0.0.1-mobile.png` (must exist locally; may be untracked)

## File map

| File | Responsibility |
|------|----------------|
| `lib/marketing/seo/types.ts` | Add optional `visualLayout` on `hero` |
| `lib/marketing/seo/industries/hvac.ts` | Set `visualLayout: "composite"` |
| `lib/marketing/seo/industries.test.ts` | Assert HVAC composite + electrician not composite |
| `components/marketing/seo/IndustryHero.tsx` | Stacked vs composite visual branch |
| `public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png` | Re-export ~1200w |
| `docs/seo/hvac/ASSETS.md` | Note ~1200w mobile |

---

### Task 1: Types + HVAC data + registry tests

**Files:**
- Modify: `lib/marketing/seo/types.ts`
- Modify: `lib/marketing/seo/industries/hvac.ts`
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Produces: `hero.visualLayout?: "stacked" | "composite"`; HVAC has `"composite"`; electrician omits

- [ ] **Step 1: Write the failing tests**

Append to `lib/marketing/seo/industries.test.ts`:

```ts
  it("hvac uses composite hero visualLayout with phoneImage", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    assert.equal(page.hero.visualLayout, "composite");
    assert.ok(page.hero.phoneImage?.src);
    assert.match(page.hero.phoneImage.src, /hvac-tax-deductions-snaptax-mobile/);
  });

  it("electrician keeps default stacked hero (no composite layout)", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    assert.notEqual(page.hero.visualLayout, "composite");
  });
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm run test:unit -- lib/marketing/seo/industries.test.ts`

Expected: FAIL — `visualLayout` undefined / not `"composite"` on HVAC

- [ ] **Step 3: Extend types**

In `lib/marketing/seo/types.ts`, inside `hero`, after `phoneImage?` (before `ogImage`), add:

```ts
    /**
     * stacked (default when omitted): worker + phone side-by-side.
     * composite: full-width phoneImage with workerImage as corner overlay.
     */
    visualLayout?: "stacked" | "composite";
```

- [ ] **Step 4: Set HVAC data**

In `lib/marketing/seo/industries/hvac.ts` `hero`, after `secondaryHref` (or next to `phoneImage`), add:

```ts
    visualLayout: "composite",
```

Do **not** add the field to `electrician.ts`.

- [ ] **Step 5: Run tests — expect PASS**

Run: `npm run test:unit -- lib/marketing/seo/industries.test.ts`

Expected: PASS (including the two new cases)

- [ ] **Step 6: Commit**

```bash
git add lib/marketing/seo/types.ts \
  lib/marketing/seo/industries/hvac.ts \
  lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): add composite visualLayout flag for HVAC hero

EOF
)"
```

---

### Task 2: Re-export HVAC mobile asset ~1200w

**Files:**
- Modify: `public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png`
- Modify: `docs/seo/hvac/ASSETS.md`

**Interfaces:**
- Consumes: `docs/seo/hvac/hvac.0.0.1-mobile.png`
- Produces: same runtime filename, width ≈ 1200

- [ ] **Step 1: Confirm source exists**

```bash
ls -la docs/seo/hvac/hvac.0.0.1-mobile.png
```

Expected: file present (if missing, stop and restore from design export before continuing).

- [ ] **Step 2: Generate optimized ~1200w PNG**

```bash
node <<'NODE'
const sharp = require('sharp');
const fs = require('fs');
const out = 'public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png';
(async () => {
  await sharp('docs/seo/hvac/hvac.0.0.1-mobile.png')
    .resize({ width: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log({ width: meta.width, height: meta.height, bytes: fs.statSync(out).size });
})();
NODE
```

Expected: `width` ≈ 1200 (or source width if smaller); bytes preferably under ~400KB.

- [ ] **Step 3: Update ASSETS.md**

Replace the mobile bullet in `docs/seo/hvac/ASSETS.md` with:

```md
- `hvac-tax-deductions-snaptax-mobile.png` — mobile UI mock / three-phone composite (~1200w)
```

- [ ] **Step 4: Commit**

```bash
git add public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png \
  docs/seo/hvac/ASSETS.md
git commit -m "$(cat <<'EOF'
feat(seo): upscale HVAC hero phone composite asset to 1200w

EOF
)"
```

---

### Task 3: IndustryHero composite layout

**Files:**
- Modify: `components/marketing/seo/IndustryHero.tsx`

**Interfaces:**
- Consumes: `page.hero.visualLayout`, `phoneImage`, `workerImage`
- Produces: stacked (unchanged) vs composite (overlay) markup

- [ ] **Step 1: Read current hero**

Open `components/marketing/seo/IndustryHero.tsx` and note the grid + right-column blocks (stacked worker 40% + phone 55% / max-w).

- [ ] **Step 2: Implement composite branch**

Replace the component body with a structure equivalent to the following (keep imports; preserve `MarketingAppLink`, breadcrumb, CTAs, trust items):

```tsx
export function IndustryHero({ page }: { page: IndustrySeoPage }) {
  const defaultPhone = MARKETING_HERO_SCREENS[0];
  const phoneImage = page.hero.phoneImage;
  const isComposite = page.hero.visualLayout === "composite";

  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <IndustryBreadcrumb
          industryLabel={page.label}
          industryHref={page.path}
        />

        <div
          className={
            isComposite
              ? "mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10"
              : "mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10"
          }
        >
          {/* LEFT COPY — keep existing H1 / subtitle / body / CTAs / trustItems unchanged */}
          <div className="min-w-0">{/* ...existing left column... */}</div>

          {isComposite && phoneImage ? (
            <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
              <div
                className="absolute inset-0 rounded-[2rem] opacity-25 blur-3xl"
                style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                aria-hidden
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={phoneImage.src}
                alt={phoneImage.alt}
                className="relative h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
              />
              <div className="absolute bottom-3 left-3 w-[30%] overflow-hidden rounded-xl border border-white/15 shadow-xl sm:bottom-4 sm:left-4 sm:rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.hero.workerImage.src}
                  alt={page.hero.workerImage.alt}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="relative mx-auto flex w-full max-w-md items-end justify-center gap-3 sm:max-w-lg sm:gap-4 lg:mx-0 lg:max-w-none lg:justify-end">
              {/* EXISTING stacked worker 40% + phone 55% / max-w block — unchanged */}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

Implementation rules:
- Do **not** leave `max-w-[16rem]` / `max-w-[18rem]` on the composite phone.
- Overlay width `w-[30%]` (within 28–34%).
- If `visualLayout === "composite"` but `phoneImage` missing, fall back to stacked (defensive).
- Left copy column: copy-paste existing markup; do not restyle CTAs.

- [ ] **Step 3: Lint check**

Run IDE diagnostics / ensure no new lint on `IndustryHero.tsx`.

- [ ] **Step 4: Manual visual check**

```bash
npm run dev
```

Open:
- `http://localhost:3000/tax-deductions/hvac` — three-phone large; worker bottom-left overlay; little empty space in right column
- `http://localhost:3000/tax-deductions/electrician` — side-by-side worker + single phone (unchanged)
- Narrow width / mobile emulator on HVAC — phone full width + overlay

- [ ] **Step 5: Commit**

```bash
git add components/marketing/seo/IndustryHero.tsx
git commit -m "$(cat <<'EOF'
feat(seo): render HVAC hero phone composite with worker overlay

EOF
)"
```

---

### Task 4: Acceptance pass

**Files:** none required unless a fix commit is needed

- [ ] **Step 1: Walk Must checklist from spec §7**

Confirm:
- HVAC three-phone clearly larger; right column not empty-looking
- Worker overlay readable; does not cover critical phone UI
- Electrician layout unchanged
- Mobile asset ~1200w at existing path
- Narrow HVAC: full-width phone + overlay

- [ ] **Step 2: Run unit tests**

```bash
npm run test:unit -- lib/marketing/seo/industries.test.ts
```

Expected: PASS

- [ ] **Step 3: Verify asset dimensions**

```bash
node -e "require('sharp')('public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png').metadata().then(m=>console.log(m.width,m.height))"
```

Expected: width ≈ 1200

- [ ] **Step 4: Commit only if cleanup remains**

Otherwise no commit.

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| `visualLayout` optional stacked/composite | Task 1 |
| HVAC `composite`; electrician omit | Task 1 |
| Re-export ~1200w same path | Task 2 |
| IndustryHero composite overlay + 1fr\|1fr | Task 3 |
| Narrow same composite | Task 3 |
| Electrician stacked unchanged | Task 3 + Task 4 |
| Acceptance §7 | Task 4 |
| No SEO copy / slug hardcode | Global + Task 3 |

**Placeholder scan:** none intentional.  
**Type consistency:** `visualLayout?: "stacked" | "composite"` used uniformly in Tasks 1–3.
