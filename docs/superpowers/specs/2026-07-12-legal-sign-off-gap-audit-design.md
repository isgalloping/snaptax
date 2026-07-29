# Legal Sign-off Gap Audit & P0/P1 Remediation

**Date:** 2026-07-12  
**Status:** Implemented (P0/P1)  
**Reference:** `docs/security/sign-off.md` · `docs/ops/us-compliance-checklist.md`

## Scope

Cross-check public legal pages (`docs/legal/*.md`, `/security` → `security-incident.md`) against `sign-off.md` checklist. **Out of scope:** dedicated `privacy@` email, counsel memo, LLC formation.

## Document map (sign-off §4 → shipped)

| sign-off item | Shipped location |
|---------------|------------------|
| Privacy Policy | `privacy.md` `/privacy` |
| Terms of Service | `terms.md` `/terms` |
| Refund Policy | `refund.md` `/refund` |
| Cookie Policy | `cookies.md` `/cookies` |
| AI Data Processing | `privacy.md` §4 |
| Tax Disclaimer | `disclaimer.md` + `terms.md` §6 |
| California Privacy Notice | `privacy.md` §8–§9 |
| Data Retention | `data-retention.md` `/data-retention` |
| Security summary | `security-incident.md` `/security` |

## Findings (pre-fix)

### Passed without change

- AI processing + no model training (`privacy.md` §4)
- Sub-processors, TLS, SCC/DPF (`privacy.md` §5–§6)
- CPRA No Sale + notice at collection (`privacy.md` §8)
- User rights + Delete Account (`privacy.md` §9)
- Paddle MoR, one-time season, 14-day US refund
- Essential cookies only, no analytics

### P0 — fixed 2026-07-12

1. **Terms:** Added explicit not tax preparation / no CPA-client; softened "for tax preparation" service description.
2. **Retention alignment:** Canonical delete-account cloud target **30 days** (`data-retention.md`); `sign-off.md` example updated from 90 → 30.
3. **Processor accuracy:** Removed erroneous `gemini` from `sign-off.md` architecture diagram (product uses OpenAI API only).

### P1 — fixed 2026-07-12

1. **Disclaimer:** Expanded tax-estimate and not-professional-advice blocks per sign-off §5.
2. **Security page:** Added encryption / access-control summary to `security-incident.md`.
3. **Marketing tagline:** `en-US` / `fr-FR` / `de-DE` — replaced "find deductions others miss" with organize/prepare records wording.

### Deferred (counsel / phase 2)

- External **Legal Review Memo** (L4)
- Dedicated `privacy@` domain email
- Standalone `/ai-disclosure` route (content lives in privacy §4)
- `docs/saas/snaptax-home.md` draft copy still says "tax preparation" (not user-facing app route)
- GDPR DPA, full vendor list, SOC2

## Verification

- [x] `docs/ops/us-compliance-checklist.md` updated with remediation rows
- [ ] Counsel Limited Review Memo (manual)
- [ ] Paddle dashboard field re-smoke after deploy

## Counsel packet

Zip for attorney: `docs/legal/*.md`, this spec, `sign-off.md`, `us-compliance-checklist.md`, `docs/ops/dsr-playbook.md`, production URLs from checklist.
