# Settings Privacy & Data — Implementation Plan

**Design:** `docs/superpowers/specs/2026-07-04-settings-privacy-data-grill-design.md`

1. Extend `LegalDoc` + `LegalSheet` (Markdown via `GET /api/legal/document`)
2. Unify `PrivacyDataSection` rows (Sheet + All policies + G1/G2)
3. Remove duplicate from `SettingsPreferencesSection`
4. `LegalMarkdownPage` + inline links (G3); update legal routes
5. `security-incident.md` Related (G4); i18n en/fr/de
