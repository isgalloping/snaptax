# 分区域省税估算 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 US/EU 分区域 `tax_amount`（仅经 OpenAI Vision）、R1 区域候选；登录后 **仅当锁定区 ≠ Ghost 语言候选区** 时重算历史小票；顶栏 `SUM(tax_amount)`。

**Architecture:** `processReceiptTax` 为唯一省税入口；`shouldRecalcOnLogin(locked, ghostCandidate)` 决定是否 `enqueueTaxRecalc`；客户端仅 `taxRecalcQueued > 0` 时轮询。

**Tech Stack:** TypeScript, Prisma 6, OpenAI Vision JSON, Zod, Vitest/node:test

**Spec:** `docs/superpowers/specs/2026-06-07-tax-savings-regional-design.md`

**依赖：** Phase 1 后端骨架（`lib/prisma.ts`、`POST /api/receipts`、OpenAI 流水线）— 可与 api-security plan Task 3+ 合并执行。

---

## 文件结构

| 路径 | 职责 |
|------|------|
| `db/init-table.sql` | +`tax_amount`, +`data_region` |
| `prisma/schema.prisma` | 同步两列 |
| `lib/tax/*` | 区域推断、US/EU 公式、聚合 |
| `lib/openai/prompts/usReceipt.ts` | US system prompt |
| `lib/openai/prompts/euReceipt.ts` | EU system prompt |
| `lib/receipts/processReceiptTax.ts` | Blob → Vision → compute → DB（唯一入口） |
| `lib/receipts/enqueueTaxRecalc.ts` | 登录后批量 OpenAI 重算 |
| `lib/client/taxRegion.ts` | 客户端 candidate + header  helper |
| `components/home/HomeScreen.tsx` | 移除 ×0.25 |
| `lib/types.ts` | Receipt + taxAmount, dataRegion |
| `docs/tech/03-api.md`, `06-*`, `08-export.md` | 契约同步 |

---

### Task 1: DDL + Prisma

**Files:**
- Modify: `db/init-table.sql`
- Modify: `prisma/schema.prisma`
- Modify: `docs/tech/04-data-model.md`, `DB-DESIGN-SPEC.md`

- [ ] **Step 1:** `ALTER`/CREATE 增加 `tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0`、`data_region VARCHAR(8) NOT NULL DEFAULT 'us'`
- [ ] **Step 2:** COMMENT ON 两列
- [ ] **Step 3:** Prisma `SnaptaxReceipt` 映射 + `npx prisma generate`

---

### Task 2: 纯函数 `lib/tax/*`

**Files:**
- Create: `lib/tax/types.ts`, `usCategories.ts`, `computeUs.ts`, `computeEu.ts`, `computeTaxAmount.ts`, `aggregate.ts`
- Test: `lib/tax/computeUs.test.ts`, `computeEu.test.ts`, `aggregate.test.ts`

- [ ] **Step 1:** 写失败测试 — US $100 TRUCK GAS → 25.00；MEALS → 12.50；PERSONAL → 0
- [ ] **Step 2:** 实现 `computeUsTaxAmount`
- [ ] **Step 3:** 写失败测试 — EU vat 19 deductible → 19；non-deductible → 0
- [ ] **Step 4:** 实现 `computeEuTaxAmount` + VAT 回算 helper
- [ ] **Step 5:** `sumTaxSaved(receipts)` 测试通过

---

### Task 3: 客户端 R1 区域候选

**Files:**
- Create: `lib/client/taxRegion.ts`
- Modify: `lib/storage/clearLocalData.ts`（已 export REGION key — 复用）

- [ ] **Step 1:** `inferTaxRegionCandidate()` per spec §4.1
- [ ] **Step 2:** `ensureTaxRegionCandidate()` — 无 key 时写入
- [ ] **Step 3:** `taxRegionHeaders()` → `{ 'X-Tax-Region': 'us'|'eu' }`
- [ ] **Step 4:** 单元测试 `inferTaxRegionCandidate`（mock navigator.languages）

---

### Task 4: OpenAI 分 region

**Files:**
- Create: `lib/openai/prompts/usReceipt.ts`, `euReceipt.ts`
- Create: `lib/openai/schemas.ts`（Zod US/EU）
- Modify: `lib/openai/receiptVision.ts`（新建若不存在）

- [ ] **Step 1:** US/EU prompt 与 schema 与 spec §2.2 / §3.2 一致
- [ ] **Step 2:** `processReceiptTax(receiptId, dataRegion)` — **必须** 调 Vision；禁止纯 DB 重算
- [ ] **Step 3:** 解析后调 `computeTaxAmount`；返回 `{ fields, taxAmount, aiRaw }`
- [ ] **Step 4:** Mock OpenAI response 单测；lint 禁止 bypass Vision 的 `tax_amount` UPDATE

---

### Task 5: API 集成

**Files:**
- Modify: `app/api/receipts/route.ts`（Phase 1 创建时一并做）
- Modify: `app/api/auth/google/route.ts`
- Modify: `docs/tech/03-api.md`

- [ ] **Step 1:** POST 读 `X-Tax-Region`，校验 enum，INSERT `data_region`
- [ ] **Step 2:** 上传完成调 `processReceiptTax`（Vision）
- [ ] **Step 3:** GET 列表返回 `taxAmount`, `dataRegion`, `taxSavedEstimate`
- [ ] **Step 4:** `POST /api/auth/google` 锁定 `data_region`；`lockedRegion === ghostCandidate` → `taxRecalcQueued=0`，否则 `enqueueTaxRecalc`

---

### Task 5b: 登录后条件重算（region 不一致）

**Files:**
- Create: `lib/receipts/enqueueTaxRecalc.ts`, `lib/tax/shouldRecalcOnLogin.ts`
- Test: `lib/tax/shouldRecalcOnLogin.test.ts`

- [ ] **Step 1:** `shouldRecalcOnLogin(lockedRegion, ghostCandidate, receiptRegions?)` — 相等返回 false
- [ ] **Step 2:** false → 仅迁移 `user_id`，不 Vision
- [ ] **Step 3:** true → 逐张 `processReceiptTax(id, lockedRegion)`；并发上限 2
- [ ] **Step 4:** 测试：us+us → queued 0；us+eu → queued N

---

### Task 6: 前端顶栏

**Files:**
- Modify: `lib/types.ts`, `lib/storage/receiptDb.ts`
- Modify: `components/home/HomeScreen.tsx`, `TaxHeader.tsx`

- [ ] **Step 1:** 删除 `calcTaxSaved` / `bumpTaxSaved(*0.25)` / `INITIAL_TAX_SAVED` 假数
- [ ] **Step 2:** App 启动 `ensureTaxRegionCandidate()`
- [ ] **Step 3:** 在线 sync 使用 `taxSavedEstimate` from API
- [ ] **Step 4:** IndexedDB Receipt 存 `taxAmount`（离线展示上次值）
- [ ] **Step 5:** Google 登录后 **仅 `taxRecalcQueued > 0`** 时轮询

---

### Task 7: Export 文档与列（Phase 3 前可只更文档）

**Files:**
- Modify: `docs/tech/08-export.md`

- [ ] **Step 1:** Summary + Expenses 列与 spec §8 一致
- [ ] **Step 2:** 实现 export 时读 `tax_amount`（随 export plan 落地）

---

### Task 8: PRODUCT-SPEC + 审计

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md` §5.1, §12, §13
- Modify: `docs/superpowers/specs/2026-06-06-product-tech-code-consistency-audit.md`（省税项 ✅）

- [ ] **Step 1:** 里程碑表增加「分区域省税」行
- [ ] **Step 2:** Agent 清单增加 tax_amount / X-Tax-Region 检查项

---

## Spec 覆盖

| Spec § | Task |
|--------|------|
| §2 US | 2, 4 |
| §3 EU | 2, 4 |
| §4.3–4.4 登录 OpenAI 重算 | 5, 5b, 6 |
| §5 DDL | 1 |
| §6 API | 5 |
| §7 UI | 6 |
| §8 Export | 7 |
