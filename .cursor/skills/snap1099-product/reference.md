# Snap1099 Product Reference

## Soft vs hard Google prompts

### Soft (§2.3 / onboarding spec)

- **T1 Nudge** (3rd done receipt): TaxHeader area banner → Settings + soft Sheet
- **T2** (first Settings visit): auto soft Google Sheet (300ms delay)
- Dismiss: **Not now** → `snap1099_google_soft_dismissed` — both triggers stop
- Success: silent bind, settings shows logged-in email

### Hard (§2.4.2 / §2.4.3)

- No dismiss; only `Continue with Google` + `BACK`
- Export copy: 导出需验证身份
- Multi-device copy: 多端查看需 Google 同步

## Settings account block (§2.4.0)

| State | Copy |
|-------|------|
| Logged out | `未登录 · 换手机数据会丢失` + Google CTA |
| Logged in | `已登录 · {email} · 数据已云端保存` |
| Paid season | `2026 Tax Season · Paid ✓` |

## Paddle paywall panel (§2.4.3)

1. `$49.00` + One-Time for {year} Tax Season
2. IRS Excel value prop
3. **Yellow warning:** 换手机前请用 Google 登录，否则本地数据会丢失
4. Button: `Pay $49 with Paddle` → Overlay
5. Success → system share (Email/WhatsApp)

## PWA install (2026-07)

| Surface | Component | Notes |
|---------|-----------|-------|
| Icon label | `app/manifest.ts` | **SnapTax** on home screen |
| Prompt capture | `InstallCaptureScript` @ root layout | Once globally |
| Marketing | `MarketingInstallShell` | bar + header; no full-screen gate |
| `/app` mobile browser | `AppBrowserEntryGate` | After Landing; skippable |
| Open installed app | `openPwaAppEntry()` | User gesture; `/app` assign |
| CTA from marketing | `MarketingAppLink` | Native `<a>` for WebAPK |

Session skip key: `snaptax_app_entry_gate_dismissed` (sessionStorage).

Full matrix: `docs/tech/13-pwa-install-architecture.md`

## Industries

`truck_driver` | `plumber` | `electrician` | `construction` | `delivery` | `general`

## KPI targets

- Time to snap button: ≤ 1.5s weak network
- Camera abandon: ≤ 5%
- Google bind rate: ≥ 40%
- Paywall conversion: monitor

## Doc map

```
docs/product/PRODUCT-SPEC.md   ← product start
docs/tech/13-pwa-install-architecture.md  ← PWA / install (Agent)
docs/tech/README.md            ← tech start (Vercel full-stack)
docs/prd/0.0.1.md              ← full PRD
docs/superpowers/specs/        ← ADRs
.cursor/rules/snap1099-*.mdc   ← Cursor rules
```
