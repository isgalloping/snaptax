# Aha Moment Onboarding — 二次审查（Remediation 后）

**Date:** 2026-06-14  
**Status:** Audit complete — optional follow-up fixes  
**Baseline:** [`2026-06-14-aha-moment-onboarding-remediation-design.md`](./2026-06-14-aha-moment-onboarding-remediation-design.md) 已全部实现

---

## 1. Remediation 验收（已通过）

| 原 ID | 状态 |
|-------|------|
| P0-1 ~ P0-3 | ✅ |
| P1-1 ~ P1-4 | ✅（P1-4 策略：demo 丢失 → re-seed shadow） |
| P2-1 ~ P2-3 | ✅ |
| P2-5 | ✅ spec §17 已更新 |
| `collectProcessingIds` 单测 | ✅ |
| onboarding 相关 tsc | ✅ 无报错 |

**单元测试：** 109 pass（2026-06-14 审查时）

---

## 2. 仍存在的问题

### P1 — 建议下一迭代修复

#### F1-1：`OfflineHomeShell` 未接入 onboarding

**状态：** ✅ 已实现（2026-06-14）

**实现：** 抽取 `useOnboardingFlow` hook；`OfflineHomeShell` 与 `HomeScreen` 共用 init / SNAP 拦截 / Orchestrator / TaxHeader override。

---

#### F1-2：`convertDemoReceiptAfterLogin` 照片 attach 失败仍 `pendingUpload`

**现象：** `attachDemoSamplePhoto()` 返回 `false` 时仍写 `pendingUpload: true` → `uploadPendingInner` 因无 photo silent return，demo 永不入库。

**方案：**

```typescript
const attached = await attachDemoSamplePhoto();
await saveReceipt({
  ...demo,
  isOnboardingDemo: false,
  pendingUpload: attached,
});
```

离线登录路径：上线后在 `handlePostLoginSync` 或 `flushPendingUploads` 前对「已去 demo 标记、无 photo、无 remote」的行补 attach。

---

#### F1-3：Onboarding 期间可删除 demo 小票

**现象：** `ReceiptDetailSheet` 无 `isOnboardingDemo` 门控；stage_1 用户删 demo 后 tooltip 仍在，卡片消失，需等下次冷启动 `ensureDemoReceiptPresent` 才恢复。

**方案：**

- Detail 层：`isOnboardingDemo` → 隐藏 Delete，或
- Delete 后立即 `saveReceipt(createShadowDemoReceipt())` + toast「Sample receipt restored」

---

#### F1-4：`GoogleSignInSheet` onboarding 模式无 `onFailure`

**现象：** `OnboardingOrchestrator` 未传 `onFailure`；登录失败仅 sheet 内 loading 结束，无错误提示。

**方案：** 传 `onFailure` → 复用 `authCopy.signInFailed`（与 export gate 一致）。

---

### P2 — 体验 / 规范差距

#### F2-1：Stage 3 中断恢复重复 Aha

**现象：** `onboarding_status === "stage_3"` 冷启动 → Orchestrator effect 重跑 odometer + snackbar + 400ms 后进 stage_4。

**方案：** 持久化 `aha_played` flag（system_meta），或 stage_3 恢复时直接升 stage_4。

---

#### F2-2：Spec §5「FLASH DONE ≤400ms」未实现

**现象：** 列表卡片无完成瞬间闪光动画，仅 status 变 done + 样式。

**方案：** demo complete 时对 `ReceiptListCard` 加 400ms CSS flash class（一次性）。

---

#### F2-3：`system_meta` 存合法值 `not_started` 时 UI 不一致

**现象：** `ensureOnboardingInitialized` 返回 `not_started` 时不升 `stage_1`；`onboardingInFlow` 为 false，但 `ensureDemoReceiptPresent` 可能已 seed demo。

**方案：** 读到 `not_started` 时原子升 `stage_1`（与首次初始化一致）。

---

#### F2-4：TaxHeader「tracked expenses」含 demo amount

**现象：** `sumDoneExpenses(receipts)` 在 sandbox 完成后含 $182.12 demo，与「样本」语义略混。

**方案（可选）：** 过滤 `isOnboardingDemo` 或在 onboarding 完成前 exclude demo from header stats。

---

### P3 — 清理 / 文档 / 流程

| ID | 项 | 方案 |
|----|-----|------|
| F3-1 | `shouldSkipLegacyCoaches` / `isSnapGateActive` 未使用 | 删除或 Settings 统一引用 |
| F3-2 | `requestSoftGoogleSheet` 状态永不被 set | 删除 prop 链或保留供未来 nudge |
| F3-3 | i18n 仍保留 snapCoach / firstReceipt / googleNudge 文案 | 删除或标记 deprecated |
| F3-4 | `PRODUCT-SPEC.md` §12 仍写 SnapCoach | 更新为 Aha onboarding |
| F3-5 | `.cursor/skills/snap1099-product/SKILL.md` 旧 coach 规则 | 同步 Aha 流程 |
| F3-6 | 服务端 export API 未过滤 demo | 登录 merge 成功后 demo 上云；失败时风险低 |
| F3-7 | 缺 `ensureOnboardingInitialized` 单测 |  mock IDB 或抽纯函数测 |
| F3-8 | 分支混部 security + onboarding | 合并前拆 PR（流程） |
| F3-9 | 沙盒图为灰色占位 PNG | 换 UI 稿真实小票图（资产） |

---

## 3. 推荐处理顺序

```text
Must-fix before merge（若追求零已知 P1）:
  F1-2 → F1-4 → F1-3

Should-fix soon:
  F1-1（OfflineHomeShell）
  F2-3（not_started 升 stage_1）

Nice-to-have:
  F2-1, F2-2, F2-4, F3-*

Process:
  F3-8 拆 PR
```

---

## 4. 结论

**Remediation 清单已全部关闭**，无 P0 编译/队列/demo 核心路径阻塞项。

**仍有 4 项 P1** 建议在 merge onboarding PR 前或紧随其后修复；其余为体验抛光与文档债务，不阻断 AC-1~7 主路径手动验收。

---

## 5. 审批

**F1-2 / F1-3 / F1-4：** ✅ 已实现（2026-06-14）

| ID | 实现 |
|----|------|
| F1-2 | `pendingUpload` 仅 attach 成功；`ensureConvertedDemoUploadReady` + flush/login 路径 |
| F1-3 | Detail 隐藏删除 + `handleDeleteReceipt` 硬拦截 |
| F1-4 | Orchestrator `onFailure` + 红色 toast |

**剩余 P1：** 无（F1-1 已关闭）
