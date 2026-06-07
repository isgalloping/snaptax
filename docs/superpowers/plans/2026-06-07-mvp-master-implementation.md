# Snap1099 MVP 总落地 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 PRODUCT-SPEC v1.2 将原型推进至可上线 MVP：Ghost HMAC API、OpenAI 小票流水线、分区域省税、Google 登录、Paddle 付费、Excel 导出。

**Architecture:** Phase 0 文档 → Phase 1 后端（api-security + tax + logging）→ Phase 2 前端接 API → Phase 3 Google/Paddle/Export。子计划承载细节；本 plan 编排顺序与验收。

**Tech Stack:** Next.js 16 · Prisma 6 · Vercel Postgres/Blob · OpenAI gpt-4o · Paddle · Google GIS · ExcelJS · Upstash 限流

**Spec:** [`2026-06-07-mvp-master-roadmap-design.md`](../specs/2026-06-07-mvp-master-roadmap-design.md)

---

## 子计划（细节勿重复，按引用执行）

| 文档 | 内容 |
|------|------|
| [`2026-06-05-api-security.md`](2026-06-05-api-security.md) | Ghost HMAC · receipts · IDOR · 限流 |
| [`2026-06-07-tax-savings-regional.md`](2026-06-07-tax-savings-regional.md) | tax_amount · R1 · OpenAI US/EU · 登录条件重算 |
| [`2026-06-06-logging.md`](2026-06-06-logging.md) | formatLogLine · withRequestLog |
| [`2026-06-05-google-auth-prd-design.md`](../specs/2026-06-05-google-auth-prd-design.md) | Google ADR |
| [`2026-06-05-paddle-paywall-design.md`](../specs/2026-06-05-paddle-paywall-design.md) | Paddle ADR |
| [`08-export.md`](../../tech/08-export.md) | Excel 契约 |

---

## Phase 0 — 文档债收尾（~0.5 天）

- [x] **0.1** 更新一致性审计（C2 关闭 · C8 tax · master plan 索引）
- [x] **0.2** [`03-api.md`](../../tech/03-api.md)：`X-Tax-Region` · `taxSavedEstimate` · `taxRecalcQueued`
- [x] **0.3** [`06-receipt-ai-pipeline.md`](../../tech/06-receipt-ai-pipeline.md)：US/EU schema · `processReceiptTax`
- [x] **0.4** [`04-data-model.md`](../../tech/04-data-model.md)：`tax_amount` · `receipt.data_region`
- [ ] **0.5** [`DB-DESIGN-SPEC.md`](../../tech/DB-DESIGN-SPEC.md) receipts 两列（实施 DDL 时一并写）

**验收：** 新人读 PRODUCT-SPEC + tech 无矛盾。

---

## Phase 1 — 后端运行时（~5–8 天）

> 执行顺序：**1.0 → 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6**；1.3 与 1.5 可交错。

### Task 1.0 — 依赖与环境

**Ref:** api-security Task 1

- [ ] `npm install`：`@vercel/blob` `openai` `zod` `@upstash/ratelimit` `@upstash/redis` `jose` `exceljs`（export 可 Phase 3 再装）
- [ ] `.env.example` 补全：`GHOST_HMAC_SECRET` `TAX_US_MARGINAL_RATE=0.25` 等
- [ ] Create `lib/prisma.ts`

### Task 1.1 — DDL 省税列

**Ref:** tax plan Task 1

- [ ] `init-table.sql` + `prisma/schema.prisma`：`tax_amount` · `data_region` on receipts
- [ ] `prisma migrate dev`

### Task 1.2 — Ghost HMAC + register

**Ref:** api-security Task 2–4

- [ ] `lib/auth/ghostToken.ts` · `getActor.ts` · `POST /api/ghost/register`
- [ ] `lib/client/ghostClient.ts`（`ensureGhostSession` · `credentials: include`）

### Task 1.3 — 省税 + OpenAI 流水线

**Ref:** tax plan Task 2–4

- [ ] `lib/tax/*` · `lib/openai/prompts/{us,eu}Receipt.ts`
- [ ] **`lib/receipts/processReceiptTax.ts`** — 唯一省税入口（Vision 必读）
- [ ] `lib/tax/shouldRecalcOnLogin.ts`

### Task 1.4 — Receipts API + Blob + Vision

**Ref:** api-security Task 6–9 + tax Task 5

- [ ] `POST/GET /api/receipts` · `GET/DELETE /api/receipts/[id]`
- [ ] 上传：`X-Tax-Region` → `data_region` → `processReceiptTax`
- [ ] 私有 Blob pathname · signed URL

### Task 1.5 — 结构化日志

**Ref:** logging plan Task 1–3

- [ ] `lib/server/log/formatLogLine.ts` · `logEvent` · `withRequestLog`
- [ ] 所有 Phase 1 Route 接入

### Task 1.6 — 安全收尾 + 删号

**Ref:** api-security Task 5、7、10–11

- [ ] 限流 · IDOR · 上传魔数
- [ ] `DELETE /api/users/me` · Ghost 删 API
- [ ] `npm run build` 通过

**Phase 1 验收：** curl register → upload → GET receipts 含 `taxAmount`；日志单行 key=value；§13 API/HMAC 可勾选。

---

## Phase 2 — 前端接 API（~3–4 天）

**Ref:** tax plan Task 3、6 + 一致性审计 Phase 2（跳过已完成 2.1）

- [ ] **2.1** `lib/client/taxRegion.ts` — R1 · `X-Tax-Region` headers
- [ ] **2.2** `HomeScreen`：移除 `mockProcessReceipt` / `×0.25`；在线 upload + 轮询
- [ ] **2.3** 离线队列：`online` → upload + UTC ISO
- [ ] **2.4** IndexedDB 存 `taxAmount` · `dataRegion`
- [ ] **2.5** Google 登录 mock → 接 `POST /api/auth/google` stub（Phase 3 换 GIS）；处理 `taxRecalcQueued`
- [ ] **2.6** `PrivacyDataSection` → `DELETE /api/users/me`
- [ ] **2.7** E2E：Ghost 拍照 → Processing → Done + 顶栏更新

**Phase 2 验收：** PRODUCT-SPEC §12「联网 OpenAI」「分区域省税」→ ✅。

---

## Phase 3 — Google · Paddle · Export（~4–6 天）

### Task 3.1 — Google OAuth（真实）

**Ref:** [`2026-06-05-google-auth-prd-design.md`](../specs/2026-06-05-google-auth-prd-design.md)

- [ ] GIS `Continue with Google` · 服务端 JWT verify
- [ ] `POST /api/auth/google`：绑定 · 迁移 receipts · **`shouldRecalcOnLogin`**
- [ ] `GET /api/auth/me` · session cookie

### Task 3.2 — Paddle

**Ref:** paddle ADR · [`07-paddle-billing.md`](../../tech/07-paddle-billing.md)

- [ ] Paddle.js Overlay · `POST /api/webhooks/paddle`
- [ ] `snaptax_season_entitlements` · 402 on export

### Task 3.3 — Export

**Ref:** [`08-export.md`](../../tech/08-export.md)

- [ ] `POST /api/export/tax-pack` · ExcelJS · Summary 含 `tax_amount` / region
- [ ] 前端 Export Again · `navigator.share`

**Phase 3 验收：** §12 Google / Paddle / Export 全 ✅；Sandbox 端到端。

---

## Phase 4 — 路线图（不实施）

- EU 分库 · 分国税法 · geo API

---

## 风险与顺序说明

| 风险 | 缓解 |
|------|------|
| OpenAI 成本（登录重算） | region 一致跳过；限流 |
| Vercel 60s upload+Vision | 先 sync MVP；文档预留 async process |
| mock → 真实 GIS 切换 | Phase 2 保留接口形状 |

---

## 完成后

- [ ] 更新 PRODUCT-SPEC §12 全 ✅
- [ ] api-security / tax / logging spec 状态 →「已实现」
- [ ] `npm run build` · `verify-offline.mjs` · 关键 API 测试
