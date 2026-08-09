# Plumber SEO — phone chrome & scale (UI polish)

Date: 2026-08-09  
Status: approved (brainstorm + grill)  
Scope: Plumber industry SEO landing only (`presentation: "mockup"`)

Related:

- Spec: `docs/superpowers/specs/2026-08-09-plumber-seo-ui-fidelity-design.md`
- Mockup: `docs/seo/plumber/plumber.0.0.1.png`
- Route: `/tax-deductions/plumber`

## 1. Goal

Fix two visual gaps vs mockup / preview feedback:

1. **Hero center phone** — too small; remove black frame / dark card look behind the device.
2. **How It Works steps banner** — remove black border panel / background around the three-phone strip; make the strip larger.

Electrician and HVAC landings must not change.

## 2. Non-goals

- No copy / FAQ / DeductionCards / other section rewrites
- No new `visualLayout` enum values
- No full-page redesign beyond these two visuals
- No phone-bezel removal inside the PNG (device chrome baked into the mock remains)

## 3. Approach

**Mockup-gated CSS + asset alpha** (not a shared `PhoneVisual` refactor).

Branch all layout/chrome changes on `page.presentation === "mockup"` and/or existing spotlight Hero path used only by Plumber.

## 4. Assets

Overwrite in place (paths unchanged in `lib/marketing/seo/industries/plumber.ts`):

| File | Change |
|------|--------|
| `public/marketing/seo/plumber-tax-deductions-snaptax-phone.png` | Add alpha: flood-fill near-black canvas from corners → transparent |
| `public/marketing/seo/plumber-tax-deductions-snaptax-steps.png` | Same |

Rules:

- **Do not** global color-key near-black (would punch through dark app UI).
- Preserve device bezels and in-screen dark UI.
- Optional note in `docs/seo/plumber/ASSETS.md` that phone/steps are transparent-canvas.
- Source exports under `docs/seo/plumber/` may stay as-is.

## 5. Component changes

### 5.1 `IndustryHero` (spotlight)

- Desktop grid → center-weighted, e.g.  
  `lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.95fr)]`
- Phone column: `w-full`; remove `max-w-[16rem]`
- Mobile: order copy → phone → highlights; phone ~`max-w-[22rem] mx-auto`
- Phone `<img>`: remove `rounded-*`, `border`, `shadow-*` — silhouette from PNG alpha

### 5.2 `HowItWorks` (`presentation === "mockup"` + `stepsBanner`)

- Remove wrapper `rounded-2xl border border-white/10` (and any panel bg)
- Banner image: full section content width; remove / relax `max-w-4xl`
- No extra border / shadow / CSS rounded clip on the banner

### 5.3 Untouched

- Stacked / composite Hero paths
- Non-mockup HowItWorks
- All other SEO sections

## 6. Acceptance

- Plumber Hero phone reads larger, with no CSS card/frame/shadow halo; floats on hero scrim via alpha.
- Plumber How It Works strip has no bordered dark panel; near full content width.
- Both PNGs report `hasAlpha === true`; in-screen UI intact (no flood-fill holes).
- Electrician + HVAC unchanged visually.
- Existing unit tests pass.
- Preview visual QA vs `plumber.0.0.1.png`.

## 7. Out of scope follow-ups

- Regenerating higher-res phone/steps from design tools (optional later)
- Applying the same treatment to other industries
