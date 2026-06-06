# Snap1099 Product Reference

## Soft vs hard Google prompts

### Soft (§2.3)

- Banner: *怕数据丢失？用 Google 账号一键保存（换手机必登录）*
- Dismiss: 「稍后再说」→ never show banner again until hard gate
- Success: silent bind, settings shows `已登录 · email`

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
docs/tech/README.md            ← tech start (Vercel full-stack)
docs/prd/0.0.1.md              ← full PRD
docs/superpowers/specs/        ← ADRs
.cursor/rules/snap1099-*.mdc   ← Cursor rules
```
