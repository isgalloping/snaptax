# Aha Moment Onboarding — 代码审查与修复方案

**Date:** 2026-06-14  
**Status:** Approved — remediation implemented (2026-06-14)  
**Scope:** 本分支 `security/remediation-phase1` 中 Aha Moment onboarding 相关变更（`lib/onboarding/*`、`components/onboarding/*`、`HomeScreen` 集成）

**Canonical spec:** [`2026-06-13-aha-moment-onboarding-design.md`](./2026-06-13-aha-moment-onboarding-design.md)

---

## 1. 审查范围

| 路径 | 变更类型 |
|------|----------|
| `lib/onboarding/*` | 新增状态机、demo receipt、storage 精简 |
| `lib/storage/receiptDb.ts` | v4 `system_meta`、`loadReceipt` |
| `components/onboarding/*` | Orchestrator + Stage UI；删除旧 Coach |
| `components/home/HomeScreen.tsx` | 集成、SNAP 拦截 |
| `components/home/ReceiptListCard.tsx` | Demo 样式 |
| `components/auth/GoogleSignInSheet.tsx` | `onboarding-signup` |
| `components/export/useTaxExportGate.tsx` | 导出过滤 demo |
| `components/settings/SettingsScreen.tsx` | **未改但依赖已删 export** |
| `public/onboarding/*` | 沙盒样本图 |

---

## 2. 问题清单（按优先级）

### P0 — 阻塞编译 / 运行时必崩

#### P0-1：`SettingsScreen` 引用已删除的 export

**现象：** `onboardingStorage.ts` 已移除 `isFirstSettingsSoftSheetEligible`，但 `SettingsScreen.tsx` 仍 import 并调用 → `tsc` 报错。

**与 spec 冲突：** §2 决策「旧 coaches 完全取代」含首次进设置 soft Sheet；§10.3 明确新用户路径禁用。

**方案（推荐 A）：**

- `SettingsScreen` 增加 prop：`skipSoftGoogleSheet?: boolean`（或 `onboardingStatus`）
- `HomeScreen` 传入：当 `onboardingStatus` 为任意非 `completed`/`null` 的 onboarding 状态时 `skipSoftGoogleSheet={true}`
- 删除对 `isFirstSettingsSoftSheetEligible` 的 import；首次进设置逻辑改为：

```typescript
if (!skipSoftGoogleSheet && !isSignedIn && !readOnboardFlag(GOOGLE_SOFT_DISMISSED_KEY) && !settingsVisited) {
  setGoogleSheet("soft");
}
```

**方案 B（最小 diff）：** 在 `onboardingStorage.ts` 恢复 `isFirstSettingsSoftSheetEligible` 纯函数，但 **不在 HomeScreen 使用** — 仍无法解决 onboarding 用户误弹 soft sheet，**不推荐**。

---

#### P0-2：Demo 小票 `processing` 会进入 ProcessingQueue

**现象：** Shadow demo 为 `status: "processing"` 且 `pendingUpload` 未设。`collectProcessingIds` / `newestProcessingId` 会将其选入队列 → `ProcessingReceiptWatcher` 对固定 ID `onboarding-demo-receipt` 轮询/触发 process API。

**与 spec 冲突：** §4.4「沙盒期间不调 OpenAI / 不上传」。

**方案：**

1. 在 `lib/client/processingQueue.ts` 的 filter 中排除 demo：

```typescript
.filter((r) => r.status === "processing" && !r.pendingUpload && !r.isOnboardingDemo)
```

2. `Receipt` 类型在 queue 输入处需带 `isOnboardingDemo?`（`StoredReceipt` 已有）
3. 补充单元测试：`collectProcessingIds` 忽略 `isOnboardingDemo: true`

**备选：** demo shadow 改用非 `processing` 的展示态 — 会动列表 UI 语义，改动面更大，不推荐。

---

#### P0-3：`onRefreshReceipts` 类型不匹配

**现象：** `OnboardingOrchestrator` 期望 `() => Promise<void>`，`HomeScreen` 传入 `refreshListFromLocal` 返回 `Promise<StoredReceipt[]>` → TS2322。

**方案：** Orchestrator prop 改为 `() => Promise<unknown>`，或 HomeScreen 包一层：

```typescript
onRefreshReceipts={async () => { await refreshListFromLocal(); }}
```

---

### P1 — 逻辑错误 / 与 spec 不一致

#### P1-1：清除本地数据后 onboarding 内存状态 stale

**现象：** `PrivacyDataSection` → `clearAllLocalData()` 会清 `system_meta`，但 `HomeScreen.onLocalDataCleared` 未重置 `onboardingStatusState` / `taxDisplayOverride`。用户可卡在 `stage_2~4` 内存态：SNAP 被 `resolveSnapIntent` 永久拦截，但 Orchestrator UI 可能已不匹配。

**方案：**

```typescript
onLocalDataCleared={async () => {
  // ...existing clears...
  setOnboardingStatusState(null);
  setTaxDisplayOverride(null);
  const status = await ensureOnboardingInitialized();
  setOnboardingStatusState(status);
  await refreshListFromLocal();
}}
```

---

#### P1-2：`convertDemoReceiptAfterLogin` 无照片 → 无效 pendingUpload

**现象：** 登录后设 `pendingUpload: true` 但未 `savePhoto`。`uploadPendingInner` 在 `loadPhoto` 为空时 silent return → demo 永不入库。

**与 spec 冲突：** §8.3「若 online：upload bundled sample image once」。

**方案：**

1. 新增 `lib/onboarding/demoReceipt.ts` → `attachDemoSamplePhoto()`：
   - `fetch("/onboarding/sample-home-depot.jpg")` → Blob
   - `savePhoto(ONBOARDING_DEMO_RECEIPT_ID, blob)`
2. 在 `convertDemoReceiptAfterLogin` 内先 attach 再 `pendingUpload: true`
3. 离线时：仅清 `isOnboardingDemo`，不设 `pendingUpload`（或登录后 online 再 attach）

---

#### P1-3：Settings 首次 soft Sheet 与 onboarding 并行（spec 违背）

**现象：** 用户 stage_1~4 或 `deferred_login` 时进入设置，300ms 后仍可能弹 `soft` Google Sheet，与 stage_4 `onboarding-signup` 叠层或重复引导。

**方案：** 同 P0-1 — HomeScreen 传 `skipSoftGoogleSheet`；`requestSoftGoogleSheet` prop 在 onboarding 进行中应忽略（nudge 已删，风险主要在 first-visit effect）。

---

#### P1-4：中断恢复 mid-stage 无自愈

**现象：** `ensureOnboardingInitialized` 对合法 `stage_1~4` 直接 return，不校验 demo 是否存在。用户删 demo 或 DB 部分损坏 → 空列表 + tooltip，违反 AC-1。

**方案：** 在 `ensureOnboardingInitialized` 末尾增加：

```typescript
if (isOnboardingActive(status) || status === "deferred_login") {
  const demo = await loadReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  if (!demo) await saveReceipt(createShadowDemoReceipt());
}
if (status === "stage_1" && demo?.status === "done") {
  // 可选：降级为 shadow 或推进到 deferred_login — 按产品决定
}
```

**推荐：** stage_1~2 缺 demo → re-seed shadow；stage_3+ 缺 demo → 若 tax 已展示过则 `deferred_login`，否则回 `stage_1`。

---

#### P1-5：`handleResnap` 绕过 SNAP 门控

**现象：** `snapButtonRef.openCamera()` 不经过 `onSnapIntent`。Onboarding 期间若存在 blurry 票（deferred 后真实拍照），resnap 可绕过 Google 硬门控。

**方案：**

- `SnapButton.openCamera` 内部已调 `onSnapIntent` — **无 bug**（ref 暴露的 `openCamera` 同一函数）
- 验证：`useImperativeHandle` 暴露的即 guarded `openCamera` ✓

**结论：** 此项 **非 bug**（只作确认记录）。

---

### P2 — 体验 / 质量 / 维护性

#### P2-1：沙盒样本图无效

**现象：** `sample-home-depot.jpg` 实为 PNG 字节重命名，部分环境可能解码失败。

**方案：** 使用真实 JPEG，或 `SandboxCameraSheet` 改引用 `.png` 并在构建时保证单一格式。

---

#### P2-2：Stage 3 → 4 过渡与 odometer 时序

**现象：** `toStage4` 固定 400ms，odometer 300ms — 可接受。但 `onTaxDisplayOverride(null)` 在离开 stage_3 时立即清除，stage_4 头 100ms 可能闪 `$0` 若 `taxSaved` 尚未 refresh。

**方案：** 进入 stage_4 时保留 override 为 `ONBOARDING_DEMO_TAX_SAVED` 直到 `refreshListFromLocal` 完成，或 `displayTaxSaved` 在 `stage_4` 也读 demo sum。

---

#### P2-3：`GoogleSignInSheet` Later 双回调

**现象：** Later 同时触发 `onSoftDismiss` + `onClose`，两者均 `handleSignupLater` → 重复写 IndexedDB。

**方案：** onboarding 模式仅保留 `onSoftDismiss`，`onClose`  no-op；或 `handleSignupLater` 幂等（已满足）— **低优先级**。

---

#### P2-4：`shouldSkipLegacyCoaches` 未接线

**现象：** 函数已 export 但应用代码未使用；Settings 仍走旧 soft sheet 路径。

**方案：** 删除 dead helper **或** 在 Settings/HomeScreen 统一使用（与 P0-1 合并）。

---

#### P2-5：Spec §17 标记「Implemented」过早

**现象：** 存在 P0 编译错误与 P1 逻辑 gap。

**方案：** 修复合并后更新 §17 为 Implemented；此前改为「Implemented (pending remediation)」。

---

#### P2-6：分支混部 security + onboarding

**现象：** 同分支含 rate limit、billing、middleware 与 onboarding，审查与回滚粒度大。

**方案（流程）：** 合并前 split PR：onboarding 独立 PR；security 独立 PR。非代码 fix，记录为发布风险。

---

## 3. 推荐修复顺序

```text
1. P0-1 SettingsScreen + skipSoftGoogleSheet     （编译 + spec）
2. P0-3 onRefreshReceipts 类型                   （编译）
3. P0-2 ProcessingQueue 排除 demo                （运行时）
4. P1-1 清除数据后 re-init onboarding            （数据一致性）
5. P1-2 attachDemoSamplePhoto + convert          （登录合并）
6. P1-4 ensure 自愈 demo                         （中断恢复）
7. P2-1 样本图格式                               （沙盒 UX）
8. P2-2 stage_4 tax 显示                         （抛光）
```

---

## 4. 测试补充（修复后）

| 用例 | 类型 |
|------|------|
| `collectProcessingIds` 跳过 `isOnboardingDemo` | unit |
| `ensureOnboardingInitialized` stage_1 无 demo → re-seed | unit/integration |
| Settings 在 `stage_1` 不弹 soft sheet | manual / component |
| 清除本地数据后 SNAP 可再次走 onboarding | manual |
| 登录后 demo `pendingUpload` + photo 存在 | manual |

---

## 5. 不在本次修复范围

- 分支内 security/billing 变更的独立审查
- Sign in with Apple
- 服务端 export API 额外过滤（当前仅客户端 `useTaxExportGate`；若 export 全走服务端需另开 task）

---

## 6. 审批

请确认：

1. P0/P1 方案是否全部采纳，或有项要降级/跳过？
2. P1-4 中断恢复策略选「re-seed shadow」还是「advance to deferred_login」？
3. 批准后可按 §3 顺序进入实现（建议单独 remediation PR，不扩大 scope）。
