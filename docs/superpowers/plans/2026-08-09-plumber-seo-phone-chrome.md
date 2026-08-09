# Plumber SEO Phone Chrome & Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Plumber Hero phone larger without CSS frame/shadow, and How It Works three-phone strip full-width without a bordered dark panel — using transparent-canvas PNGs.

**Architecture:** Mockup-gated Tailwind changes in `IndustryHero` (spotlight) and `HowItWorks`. One-shot Node script (sharp) flood-fills near-black canvas from corners on phone + steps PNGs, overwriting the same public paths. No new components or data-field changes.

**Tech Stack:** Next.js marketing components, Tailwind 4, sharp (already in `package.json`), node:test + tsx for asset alpha assertion.

## Global Constraints

- Scope: Plumber only (`presentation: "mockup"` / spotlight Hero). Electrician + HVAC must not regress.
- Do not global color-key near-black (would punch dark app UI). Flood-fill from corners only.
- Overwrite `plumber-tax-deductions-snaptax-phone.png` and `plumber-tax-deductions-snaptax-steps.png` in place; keep `plumber.ts` src paths.
- Remove CSS `rounded` / `border` / `shadow` on those visuals; silhouette from PNG alpha.
- Spec: `docs/superpowers/specs/2026-08-09-plumber-seo-phone-chrome-design.md`

## File map

| File | Responsibility |
|------|----------------|
| `scripts/seo-knockout-near-black.mjs` | Corner flood-fill → write alpha PNG |
| `public/marketing/seo/plumber-tax-deductions-snaptax-phone.png` | Hero phone (overwrite, alpha) |
| `public/marketing/seo/plumber-tax-deductions-snaptax-steps.png` | Steps strip (overwrite, alpha) |
| `docs/seo/plumber/ASSETS.md` | Note transparent canvas |
| `lib/marketing/seo/industries.test.ts` | Assert phone/steps `hasAlpha` |
| `components/marketing/seo/IndustryHero.tsx` | Spotlight size + no chrome |
| `components/marketing/seo/HowItWorks.tsx` | Mockup banner no panel + wider |

---

### Task 1: Transparent phone + steps assets

**Files:**
- Create: `scripts/seo-knockout-near-black.mjs`
- Modify: `public/marketing/seo/plumber-tax-deductions-snaptax-phone.png`
- Modify: `public/marketing/seo/plumber-tax-deductions-snaptax-steps.png`
- Modify: `docs/seo/plumber/ASSETS.md`
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Consumes: sharp API; PNG paths under `public/marketing/seo/`
- Produces: RGBA PNGs with `hasAlpha: true`; test `plumber phone and steps assets have alpha channel`

- [ ] **Step 1: Write the failing alpha assertion**

Add to `lib/marketing/seo/industries.test.ts` (top-level imports already use `node:test` / `node:assert/strict`; add `node:path` + `sharp`):

```ts
import path from "node:path";
import sharp from "sharp";

// inside describe("industry seo pages", ...):
  it("plumber phone and steps assets have alpha channel", async () => {
    const root = process.cwd();
    for (const rel of [
      "public/marketing/seo/plumber-tax-deductions-snaptax-phone.png",
      "public/marketing/seo/plumber-tax-deductions-snaptax-steps.png",
    ]) {
      const meta = await sharp(path.join(root, rel)).metadata();
      assert.equal(meta.hasAlpha, true, `${rel} must have alpha`);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- --test-name-pattern="plumber phone and steps assets have alpha"`

Expected: FAIL — `hasAlpha` is `false` (or assertion message includes `must have alpha`).

- [ ] **Step 3: Add knockout script**

Create `scripts/seo-knockout-near-black.mjs`:

```js
#!/usr/bin/env node
/**
 * Corner flood-fill: turn near-black canvas into transparent alpha.
 * Does not color-key interior dark UI pixels.
 *
 * Usage:
 *   node scripts/seo-knockout-near-black.mjs <png> [<png>...]
 *   node scripts/seo-knockout-near-black.mjs --threshold=14 path.png
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
let threshold = 14;
const files = [];
for (const a of args) {
  if (a.startsWith("--threshold=")) {
    threshold = Number(a.slice("--threshold=".length));
  } else {
    files.push(a);
  }
}
if (files.length === 0) {
  console.error("Usage: node scripts/seo-knockout-near-black.mjs [--threshold=14] <png>...");
  process.exit(1);
}

function isNearBlack(r, g, b, t) {
  return r <= t && g <= t && b <= t;
}

async function knockout(file) {
  const abs = path.resolve(file);
  const { data, info } = await sharp(abs)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`${file}: expected 4 channels, got ${channels}`);

  const visited = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let qh = 0;
  let qt = 0;

  const seeds = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  for (const [sx, sy] of seeds) {
    const si = sy * width + sx;
    if (visited[si]) continue;
    const off = si * 4;
    if (!isNearBlack(data[off], data[off + 1], data[off + 2], threshold)) continue;
    visited[si] = 1;
    qx[qt] = sx;
    qy[qt] = sy;
    qt++;
  }

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;
    const i = y * width + x;
    const o = i * 4;
    data[o + 3] = 0;
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (visited[ni]) continue;
      const no = ni * 4;
      if (!isNearBlack(data[no], data[no + 1], data[no + 2], threshold)) continue;
      visited[ni] = 1;
      qx[qt] = nx;
      qy[qt] = ny;
      qt++;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(abs);
  const meta = await sharp(abs).metadata();
  console.log(`ok ${file} hasAlpha=${meta.hasAlpha} size=${meta.width}x${meta.height}`);
}

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error(`missing: ${f}`);
    process.exit(1);
  }
  await knockout(f);
}
```

- [ ] **Step 4: Run knockout on Plumber assets**

Run:

```bash
node scripts/seo-knockout-near-black.mjs \
  public/marketing/seo/plumber-tax-deductions-snaptax-phone.png \
  public/marketing/seo/plumber-tax-deductions-snaptax-steps.png
```

Expected: two `ok ... hasAlpha=true` lines.

Manually spot-check (optional): open both PNGs — exterior black gone, phone screens intact. If edges look wrong, re-run with `--threshold=18` (or lower to `10`) after restoring from git and re-running.

If you need to restore before re-trying:

```bash
git checkout -- \
  public/marketing/seo/plumber-tax-deductions-snaptax-phone.png \
  public/marketing/seo/plumber-tax-deductions-snaptax-steps.png
```

- [ ] **Step 5: Update ASSETS.md**

Replace the phone/steps bullets in `docs/seo/plumber/ASSETS.md` with:

```md
- `plumber-tax-deductions-snaptax-phone.png` — Hero single-phone mock (transparent canvas alpha)
- `plumber-tax-deductions-snaptax-steps.png` — How it Works three-phone strip (~1200w, transparent canvas alpha)
```

- [ ] **Step 6: Re-run alpha test**

Run: `npm run test:unit -- --test-name-pattern="plumber phone and steps assets have alpha"`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add \
  scripts/seo-knockout-near-black.mjs \
  public/marketing/seo/plumber-tax-deductions-snaptax-phone.png \
  public/marketing/seo/plumber-tax-deductions-snaptax-steps.png \
  docs/seo/plumber/ASSETS.md \
  lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): transparent canvas for plumber phone and steps assets

EOF
)"
```

---

### Task 2: Spotlight Hero — larger phone, no CSS chrome

**Files:**
- Modify: `components/marketing/seo/IndustryHero.tsx` (spotlight branch ~lines 123–183)

**Interfaces:**
- Consumes: existing spotlight path (`visualLayout === "spotlight"`); Task 1 alpha phone PNG
- Produces: center-weighted grid; phone without border/shadow/rounded CSS

- [ ] **Step 1: Update spotlight grid + phone markup**

In `IndustryHero.tsx` spotlight branch, replace the grid + phone column:

**Before:**

```tsx
<div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)_minmax(0,0.95fr)] lg:gap-8">
```

**After:**

```tsx
<div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.95fr)] lg:gap-8">
```

**Before:**

```tsx
            <div className="mx-auto w-full max-w-[16rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={phoneImage.src}
                alt={phoneImage.alt}
                className="h-auto w-full rounded-[1.35rem] border border-white/10 shadow-2xl"
              />
            </div>
```

**After:**

```tsx
            <div className="mx-auto w-full max-w-[22rem] lg:max-w-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={phoneImage.src}
                alt={phoneImage.alt}
                className="h-auto w-full"
              />
            </div>
```

Do **not** change stacked/composite branches (they may keep `rounded` / `border` / `shadow`).

- [ ] **Step 2: Sanity check unit suite still green**

Run: `npm run test:unit -- --test-name-pattern="industry seo"`

Expected: PASS (including plumber mockup + alpha tests).

- [ ] **Step 3: Commit**

```bash
git add components/marketing/seo/IndustryHero.tsx
git commit -m "$(cat <<'EOF'
feat(seo): enlarge spotlight hero phone without CSS chrome

EOF
)"
```

---

### Task 3: HowItWorks mockup — strip panel + widen banner

**Files:**
- Modify: `components/marketing/seo/HowItWorks.tsx` (~lines 72–83)

**Interfaces:**
- Consumes: `page.presentation === "mockup"`; Task 1 alpha steps PNG
- Produces: no bordered panel; near full-width banner for mockup only

- [ ] **Step 1: Branch mockup banner chrome**

Replace the `stepsBanner` block in `HowItWorks.tsx` with:

```tsx
        {howItWorks.stepsBanner ? (
          isMockup ? (
            <div className="mt-14">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={howItWorks.stepsBanner.src}
                alt={howItWorks.stepsBanner.alt}
                className="mx-auto h-auto w-full object-contain"
              />
            </div>
          ) : (
            <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={howItWorks.stepsBanner.src}
                alt={howItWorks.stepsBanner.alt}
                className="mx-auto h-auto w-full max-w-4xl object-contain"
              />
            </div>
          )
        ) : null}
```

Non-mockup pages keep the existing bordered panel + `max-w-4xl` (currently only Plumber uses `stepsBanner`, but keep the branch for safety).

- [ ] **Step 2: Re-run industry unit tests**

Run: `npm run test:unit -- --test-name-pattern="industry seo"`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/marketing/seo/HowItWorks.tsx
git commit -m "$(cat <<'EOF'
feat(seo): remove mockup HowItWorks banner panel and widen strip

EOF
)"
```

---

### Task 4: Acceptance + preview

**Files:**
- None required (verify + ship)

**Interfaces:**
- Consumes: Tasks 1–3
- Produces: green unit suite; preview deploy with visual QA note

- [ ] **Step 1: Full unit suite**

Run: `npm run test:unit`

Expected: all tests PASS (or same pre-existing baseline if any unrelated failures — industry + alpha tests must PASS).

- [ ] **Step 2: Grep guard — mockup-only chrome removal**

Run:

```bash
rg -n "max-w-\[16rem\]|shadow-2xl|rounded-2xl border border-white/10" components/marketing/seo/IndustryHero.tsx components/marketing/seo/HowItWorks.tsx
```

Expected:

- Spotlight phone block in `IndustryHero` must **not** still use `max-w-[16rem]` or `shadow-2xl` / phone `border border-white/10`.
- Composite/stacked Hero may still use `shadow-2xl` — that is OK.
- Mockup HowItWorks branch must **not** wrap stepsBanner in `rounded-2xl border border-white/10`.

- [ ] **Step 3: Push feature branch and merge to preview**

```bash
git push origin feat/plumber-seo-landing
git fetch origin preview
git checkout preview
git pull origin preview
git merge feat/plumber-seo-landing -m "$(cat <<'EOF'
merge: plumber phone chrome polish into preview

EOF
)"
git push origin preview
git checkout feat/plumber-seo-landing
```

- [ ] **Step 4: Hand off visual QA**

Ask the user to check preview `/tax-deductions/plumber` against `docs/seo/plumber/plumber.0.0.1.png`:

1. Hero phone larger, no dark card/frame
2. How It Works strip no bordered panel, wider
3. Spot-check electrician + HVAC unchanged

Do **not** merge PR #227 to main until user confirms.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Transparent phone + steps via corner flood-fill | Task 1 |
| Overwrite same public paths | Task 1 |
| ASSETS.md note | Task 1 |
| Hero center-weighted grid + larger phone | Task 2 |
| Remove Hero CSS rounded/border/shadow | Task 2 |
| Mobile ~22rem centered phone | Task 2 (`max-w-[22rem] lg:max-w-none`) |
| HowItWorks remove panel + widen | Task 3 |
| Plumber-only / no electrician-HVAC regression | Tasks 2–3 gates + Task 4 QA |
| Unit tests + preview | Tasks 1, 4 |
