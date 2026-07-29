# 小票导出逻辑优化与 Bug 修复 — 实现计划

> **Spec:** `docs/superpowers/specs/2026-06-11-export-optimization-bugfix-design.md`  
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复导出流程中的产品语义 Bug、竞态条件、错误处理不足，并添加 UX 优化。

**Architecture:** 修改 export API route、SettingsScreen 组件、PaywallSheet 组件、authApi 客户端、useAuthSession hook、season 工具函数。

**Tech Stack:** Next.js API Routes, React 19, ExcelJS, Prisma, Paddle.js

---

## File map

| File | Action | Bug/优化 |
|------|--------|---------|
| `app/api/export/tax-pack/route.ts` | Modify | B1, B9, B11 |
| `components/settings/SettingsScreen.tsx` | Modify | B2, B6, B7, B8, O1, O2, O4 |
| `components/settings/PaywallSheet.tsx` | Modify | B12 |
| `lib/client/authApi.ts` | Modify | B7, B2 |
| `lib/client/useAuthSession.ts` | Modify | B5 |
| `lib/tax/season.ts` | Modify | B3 |
| `docs/tech/08-export.md` | Modify | 文档对齐 |

---

### Task 1: B1 — 导出查询修复（全量 done 小票）

**Files:** `app/api/export/tax-pack/route.ts`

- [ ] **Step 1:** 移除 `unfiledReceiptWhere()` import 和调用，查询条件改为 `{ userId, status: "done" }`
- [ ] **Step 2:** 保留导出后的 `updateMany` 标记 `taxSeason`/`taxSeasonDate`（幂等）

---

### Task 2: B9 + B11 — 服务端日志 + IRS Schedule 列

**Files:** `app/api/export/tax-pack/route.ts`

- [ ] **Step 1:** Import `logEvent` + `irsScheduleLabel`
- [ ] **Step 2:** Expenses sheet 增加 "IRS Schedule" 列
- [ ] **Step 3:** 每行填充 `irsScheduleLabel(r.category ?? undefined)`
- [ ] **Step 4:** 导出成功后 emit `biz.export` 日志（`receiptCount`, `taxSeason`）

---

### Task 3: B7 — 客户端区分 NO_RECEIPTS 错误

**Files:** `lib/client/authApi.ts`

- [ ] **Step 1:** `exportTaxPack` 增加 422 状态码判断，抛出 `NO_RECEIPTS`

---

### Task 4: B2 — 支付→导出轮询

**Files:** `lib/client/authApi.ts`

- [ ] **Step 1:** 新增 `pollEntitlementReady(season, maxMs)` 函数

---

### Task 5: B3 — currentTaxSeason 死代码清理

**Files:** `lib/tax/season.ts`

- [ ] **Step 1:** 简化为单行返回 + TODO 注释

---

### Task 6: B5 — localStorage 付费缓存修正

**Files:** `lib/client/useAuthSession.ts`

- [ ] **Step 1:** API 返回 `paid=false` 时调用 `setSeasonPaid(CURRENT_SEASON, false)`
- [ ] **Step 2:** 移除 `prev ||` 逻辑，API 在线时优先

---

### Task 7: B8 + B6 + O1 + O2 + O4 — SettingsScreen 全面重构

**Files:** `components/settings/SettingsScreen.tsx`

- [ ] **Step 1:** 添加 `exporting` state
- [ ] **Step 2:** 提取 `safeExport()` 统一函数（含离线检查、错误分类、refreshSeasonPaid）
- [ ] **Step 3:** `shareExportFile` 修复 share 取消 vs 错误区分
- [ ] **Step 4:** `handleExport`/`handleExportAgain`/`runAfterGoogleSignIn` 统一使用 `safeExport()`
- [ ] **Step 5:** PaywallSheet `onPaid` 回调使用轮询
- [ ] **Step 6:** 导出按钮添加 disabled + loading 文案

---

### Task 8: B12 — PaywallSheet useEffect 修复

**Files:** `components/settings/PaywallSheet.tsx`

- [ ] **Step 1:** `onPaid` 用 `useRef` 包装
- [ ] **Step 2:** `useEffect` 依赖去除 `onPaid`，改为空数组

---

### Task 9: 文档对齐

**Files:** `docs/tech/08-export.md`

- [ ] **Step 1:** Summary sheet 增加 Est. Tax Saved 行（代码已有，文档未写）
- [ ] **Step 2:** Expenses sheet 增加 Tax Saved + IRS Schedule 列
- [ ] **Step 3:** §8.5 明确 "全量导出" 语义
- [ ] **Step 4:** §8.3 明确使用方案 B

---

### Task 10: 验证

- [ ] **Step 1:** `npm run lint`
- [ ] **Step 2:** `npm run build`
- [ ] **Step 3:** `npm run test:unit`
- [ ] **Step 4:** Dev server 手动验证导出按钮状态
