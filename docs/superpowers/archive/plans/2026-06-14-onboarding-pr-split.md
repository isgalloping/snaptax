# Onboarding PR 拆分计划

**Date:** 2026-06-14  
**Branch:** `security/remediation-phase1`（onboarding + security/billing 混部）  
**Goal:** 将 Aha Moment onboarding 与 security/billing 变更拆成独立 PR，便于 review 与回滚。

---

## 1. 目标分支

| PR | 建议分支 | 基线 | 说明 |
|----|----------|------|------|
| **A — Aha Onboarding** | `feature/aha-onboarding` | `main` | 产品引导全流程 |
| **B — Security / Billing** | `security/remediation-phase1`（或重命名） | `main` | middleware、auth、billing 等 |

**合并顺序建议：** A 先 merge（产品可见、单测覆盖好），B 紧随其后或并行 review。

---

## 2. PR A 文件清单（onboarding）

### 核心逻辑

```
lib/onboarding/
lib/storage/receiptDb.ts          # v4 system_meta + demo helpers
lib/client/processingQueue.ts     # 排除 isOnboardingDemo
lib/types.ts                      # isOnboardingDemo 等
```

### UI 组件

```
components/onboarding/              # 全部（含 useOnboardingFlow.ts）
components/home/HomeScreen.tsx
components/home/OfflineHomeShell.tsx
components/home/ReceiptListCard.tsx
components/home/SnapButton.tsx
components/home/TaxHeader.tsx
components/home/ReceiptCaptureActions.tsx   # 若有 onboarding 相关改动
components/settings/SettingsScreen.tsx      # skipSoftGoogleSheet
components/receipts/ReceiptDetailSheet.tsx  # demo 删除门控
components/export/useTaxExportGate.tsx
components/auth/GoogleSignInSheet.tsx       # onboarding-signup 模式
```

### 静态资源

```
public/onboarding/
```

### i18n

```
components/i18n/I18nProvider.tsx    # onboarding 文案（若本 PR 含 coach 删除）
```

### 测试

```
lib/onboarding/*.test.ts
lib/client/processingQueue.test.ts  # demo 排除
lib/onboarding/onboardingStorage.test.ts
```

### 文档

```
docs/superpowers/specs/2026-06-13-aha-moment-onboarding-design.md
docs/superpowers/plans/2026-06-13-aha-moment-onboarding.md
docs/superpowers/specs/2026-06-14-aha-moment-onboarding-remediation-design.md
docs/superpowers/specs/2026-06-14-aha-moment-onboarding-followup-audit.md
docs/product/PRODUCT-SPEC.md        # §12 实现状态（可选 F3-4）
```

### 删除（旧 coach）

```
components/home/SnapCoachBanner.tsx      # 若已删
components/home/FirstReceiptCoach.tsx
components/home/GoogleBackupNudge.tsx
```

---

## 3. PR B 文件清单（非 onboarding — 示例）

> 以 `git diff main --name-only` 为准；下列为典型 security/billing 路径，**勿**与 PR A 重复。

```
middleware.ts
lib/server/auth*
lib/server/billing*
lib/server/env.ts
app/api/**/route.ts                 # 非 receipt onboarding 相关
docs/superpowers/specs/*security*
docs/superpowers/specs/*billing*
```

---

## 4. 操作步骤（cherry-pick 法）

```bash
# 1. 从 main 拉 onboarding 专用分支
git fetch origin
git checkout main
git pull origin main
git checkout -b feature/aha-onboarding

# 2. 从混部分支 cherry-pick onboarding 相关 commit（若有独立 commit）
git log security/remediation-phase1 --oneline -- lib/onboarding components/onboarding

# 若无干净 commit 历史，用 path 检出：
git checkout security/remediation-phase1 -- \
  lib/onboarding \
  components/onboarding \
  public/onboarding \
  # ... 按 §2 清单追加

# 3. 跑验证
npm run test:unit
npm run lint

# 4. 推送并开 PR A
git push -u origin feature/aha-onboarding
gh pr create --title "feat: Aha Moment onboarding" --body "..."
```

**混部单 commit 时：** 用 `git checkout <branch> -- <paths>` 分批 staging，或 interactive 拆 commit（`git add -p`）。

---

## 5. 验收清单（PR A）

- [ ] 冷启动 → stage_1 tooltip + SNAP 拦截
- [ ] Sandbox → Aha $28.50 → Google signup / Later → deferred_login
- [ ] OfflineHomeShell（StartupShell 5s 降级）同样走 onboarding
- [ ] Demo 不可删除；export 不含 demo
- [ ] 清除本地数据 → re-init onboarding + re-seed shadow demo
- [ ] `npm run test:unit` 全绿

---

## 6. 风险

| 风险 | 缓解 |
|------|------|
| `receiptDb.ts` 同时含 security 字段 | PR A 只取 onboarding migration；B 取其余 |
| `HomeScreen` 同时改 auth sync | 手动 merge conflict，保留两边逻辑 |
| 删 coach 与 i18n 不同步 | PR A 一次性包含 i18n + 删文件 |

---

## 7. 状态

- [x] F1-1 OfflineHomeShell + `useOnboardingFlow`
- [ ] 执行 git 拆分支（待 owner 确认 base commit）
- [ ] PR A / PR B 创建
