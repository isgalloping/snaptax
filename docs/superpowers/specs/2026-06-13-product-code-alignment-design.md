# Snap1099 产品规范 ↔ 代码 全面对齐设计

**日期：** 2026-06-13  
**状态：** 已批准（方案 A）  
**Canonical：** [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) v1.2  
**前置审计：** [`2026-06-06-product-tech-code-consistency-audit.md`](./2026-06-06-product-tech-code-consistency-audit.md)

---

## 1. 背景

2026-06-06 审计时后端 API 尚未落地；截至 2026-06-13，Ghost HMAC、OpenAI 流水线、Google 绑定、分区域省税、Paddle Webhook 均已实现，但 **PRODUCT-SPEC §12 仍描述 mock/❌**。同时 onboarding 组件已建但未接线，Paywall 存在无 Paddle 时的假成功路径。

**方案 A（用户选定）：** 文档与代码一次性全面对齐。

---

## 2. 对齐矩阵

| 项 | 动作 | 负责层 |
|----|------|--------|
| PRODUCT-SPEC §12 里程碑 | 更新为 2026-06-13 真实状态 | 文档 |
| §3.1 快门 cooldown | 改为 **300ms**（以 `2026-06-10-camera-live-footer-column-ratio-design` 为准） | 文档 |
| Coach / Nudge / 首次 Settings soft Sheet | 接线 `HomeScreen` + `SettingsScreen` | 代码 |
| `GOOGLE_SOFT_DISMISSED_KEY` | Not now 写入；T1/T2 共用 | 代码 |
| Paywall 无 Paddle env | **阻断**并红字提示，禁止 `onPaid()` 假成功 | 代码 |
| 行业选择 | 登录后 `/api/auth/me` hydrate；Ghost `localStorage` 持久化 | 代码 |
| `mockReceipts.ts` / `mockGoogleSignIn` | 删除死代码 | 代码 |
| cursor rules / skill / audit doc | 同步实现状态 | 文档 |

---

## 3. Onboarding 接线规范

### 3.1 存储键

| Key | 用途 |
|-----|------|
| `snap1099_onboard_snap_hint_dismissed` | SnapCoach 关闭 |
| `snap1099_onboard_first_receipt_coach` | 首票 Coach 完成 |
| `snap1099_google_soft_dismissed` | 软引导全局 Not now |
| `snap1099_settings_visited` | 首次进入设置（与是否登录无关） |
| `snap1099_industry` | Ghost 行业选择 |

### 3.2 T1 — 第 3 张 done 票 Nudge

- 条件：`doneCount ≥ 3` && 未登录 && 未 soft dismiss && PWA bar 不可见 && 本会话未隐藏
- UI：`GoogleBackupNudge` 于 `TaxHeader` 下方
- 点击 → 进 Settings + 打开 soft Sheet
- Dismiss / 10s → 本会话隐藏；Not now on Sheet → 永久 dismiss

### 3.3 T2 — 首次进 Settings

- 进入 Settings 写 `settings_visited`
- 若首次 && 未登录 && 未 soft dismiss → **300ms** 后自动 `googleSheet('soft')`

### 3.4 Coach

- `SnapCoachBanner`：0 张票、未 dismiss、无 PWA bar
- `FirstReceiptCoach`：1 张票、未完成 coach；5s 自动完成或列表内展示

---

## 4. Paywall 修正

无 `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` / `priceId` / Paddle 实例时：

- 显示红字：`Payment unavailable. Paddle is not configured.`
- **禁止**调用 `onPaid()`

---

## 5. 验收

- [ ] §12 与代码一致；Agent 读 spec 不会误判 mock
- [ ] 第 3 张 done 未登录时出现 Google Nudge
- [ ] 首次 Settings 自动 soft Sheet（可 Not now）
- [ ] 无 Paddle env 时 Paywall 不假成功
- [ ] 登录后行业从 API 回填；Ghost 刷新保留行业
- [ ] `npm run test:unit` 通过

---

## 6. 不在范围

- EU 分库基础设施
- 行业 AI 自动猜测（仍依赖 OpenAI industry hint + 用户手动选择）
- Upstash 限流本地放行（文档注明 dev 限制）
