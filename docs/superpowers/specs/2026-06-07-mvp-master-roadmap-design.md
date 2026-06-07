# Snap1099 MVP 总路线图设计

**日期：** 2026-06-07  
**状态：** 已批准  
**范围：** PRODUCT-SPEC v1.2 从原型 → 可上线 MVP 的分阶段交付  
**Canonical 产品：** `docs/product/PRODUCT-SPEC.md`

---

## 1. 遗漏检查结论（2026-06-07）

### 1.1 已就绪（无需重复设计）

| 项 | 状态 |
|----|------|
| 产品规范 v1.2 + 合规 UI + 法律文案 | ✅ |
| Google 软/硬引导 UI（无手机号） | ✅ 代码已落地 |
| Paywall / 账户区 UI（mock） | ✅ |
| DB 四表 + Prisma 6 + UTC + `data_region` on users | ✅ |
| Phase 0 文档（Ghost HMAC、合规 MVP 覆盖声明） | ✅ 主体完成 |
| ADR：api-security · db-alignment · compliance · tax · logging | ✅ |
| 子计划：api-security · logging · tax-savings-regional · db-alignment | ✅ |

### 1.2 原审计/计划遗漏（本次补齐）

| ID | 遗漏 | 处理 |
|----|------|------|
| G1 | **无 MVP 总 implementation plan** | 本文 + [`2026-06-07-mvp-master-implementation.md`](../plans/2026-06-07-mvp-master-implementation.md) |
| G2 | **省税规则未进 Cursor rules** | 新增 `snap1099-tax.mdc` |
| G3 | **`snaptax_receipts` 缺 `tax_amount`/`data_region` 列** | Phase 1 Task 0（tax plan Task 1） |
| G4 | **`06-receipt-ai-pipeline.md` 未写 US/EU 分支** | Phase 0 文档 Task + Phase 1 实现 |
| G5 | **`03-api.md` 缺 `X-Tax-Region`/`taxRecalcQueued`** | Phase 0 文档 Task |
| G6 | **Google OAuth / Paddle 无独立 implementation plan** | 纳入 Phase 3 任务（引用 ADR） |
| G7 | **Export 无 implementation plan** | 纳入 Phase 3（引用 `08-export.md`） |
| G8 | **一致性审计 C2/2.1 已过时**（手机号已删） | 更新审计文档 |
| G9 | **`lib/server/log/*` 未实现** | Phase 1 与 api 并行（logging plan） |
| G10 | **IndexedDB 未存 `taxAmount`** | Phase 2 |

### 1.3 仍不在 MVP 范围

- EU Frankfurt 物理分库 · `GET /api/geo/region`
- 手机号注册 · 客户端 mock 省税 `×0.25`
- Prisma 7 · `image_url` 列 rename

---

## 2. 阶段划分

```
Phase 0  文档债收尾（0.5d）
Phase 1  后端运行时（5–8d）— api-security + tax + logging + DDL
Phase 2  前端接 API（3–4d）— 去 mock、R1、顶栏 SUM(tax_amount)
Phase 3  身份/付费/导出（4–6d）— Google GIS、Paddle、Excel
Phase 4  路线图 — EU 分库、分国税法引擎
```

**依赖：** `0 → 1 → 2`；Phase 3 中 Google 与 Paddle 可部分并行于 2 后期。

---

## 3. Phase 1 内部顺序（关键路径）

1. 依赖 + env + `lib/prisma.ts`
2. DDL **`tax_amount` + `data_region`**（receipts）
3. Ghost HMAC + `POST /api/ghost/register`
4. `lib/tax/*` + `lib/openai/*` + **`processReceiptTax`（唯一省税路径）**
5. `POST/GET /api/receipts` + Blob + Vision
6. `lib/server/log/*` + `withRequestLog` 接入 Route
7. 限流 · IDOR · `DELETE /api/users/me`

---

## 4. 验收（MVP Done）

| 检查 | 来源 |
|------|------|
| Ghost 联网 OpenAI，非 mock | PRODUCT-SPEC §5、§12 |
| HMAC Cookie，非裸 Ghost UUID | §2.5 |
| Est. Tax Saved = SUM(tax_amount)，OpenAI 路径 | §5.1 |
| 登录 region 一致跳过重算 | tax spec §4.3 |
| Google 绑定 + 条件重算 | §4.4 |
| Paddle + Export | §6 |
| 单行 key=value 日志 | logging spec |

---

## 5. 子计划索引

| 计划 | Phase |
|------|-------|
| [2026-06-07-mvp-master-implementation.md](../plans/2026-06-07-mvp-master-implementation.md) | **总落地** |
| [2026-06-05-api-security.md](../plans/2026-06-05-api-security.md) | 1 |
| [2026-06-07-tax-savings-regional.md](../plans/2026-06-07-tax-savings-regional.md) | 1–2 |
| [2026-06-06-logging.md](../plans/2026-06-06-logging.md) | 1 |
| google-auth / paddle ADR | 3 |

---

## 6. Rules 索引

| Rule | 用途 |
|------|------|
| `snap1099-product.mdc` | 产品铁律 |
| `snap1099-tax.mdc` | 省税 US/EU · OpenAI 路径 |
| `snap1099-backend.mdc` | API · Prisma · 集成 |
| `snap1099-database.mdc` | DDL · 新列 |
| `snap1099-logging.mdc` | 单行日志 |

**实施：** 见 master implementation plan。
