# Snap1099 产品规范 · 技术文档 · 代码 一致性审计

**日期：** 2026-06-06  
**状态：** Phase 0 已完成（2026-06-06）；**2026-06-07 增补** tax + MVP master plan；Phase 1+ 待实施  
**Canonical 产品文档：** `docs/product/PRODUCT-SPEC.md` v1.2  
**审计方法：** PRODUCT-SPEC → `docs/tech/*` → ADR specs → `db/` / `prisma/` → 客户端/服务端代码

---

## 1. 结论摘要

| 维度 | 一致 | 部分一致 | 严重偏离 |
|------|------|----------|----------|
| 数据库 DDL / Prisma | ● | ○ `data_region` 宽度 | |
| 合规 UI / 法律文案 | ● | | |
| API / 后端 | | | ● 无 `app/api/` |
| 身份（Google vs 手机） | ● Google UI 已落地 | | |
| 小票流水线（OpenAI） | | | ● 仍为 client mock |
| 分区域省税 tax_amount | | | ● 代码 ×0.25；DDL 待加列 |
| Ghost 安全（HMAC） | | ○ 文档混用 `X-Ghost-Id` | ● 代码未实现 |
| ADR / 技术文档交叉引用 | | ○ 旧 ADR 与 v1.2 冲突 | |

**总体：** 产品规范 v1.2 与 **DB/合规 UI** 已基本对齐；**运行时能力（API、Google、OpenAI、Paddle）仍停留在原型**，且部分 **技术文档 / ADR 仍描述已废弃的 EU 分域或旧 Ghost 模型**。

---

## 2. 已对齐项（无需改产品，仅维护）

| 项 | 依据 |
|----|------|
| 四表 schema、`TIMESTAMPTZ(3)`、`image_url`=pathname、receipts CASCADE | `db/init-table.sql` ↔ `DB-DESIGN-SPEC` ↔ db-product-alignment ADR |
| Prisma 6 + `@db.Timestamptz(3)` | `prisma/schema.prisma` |
| UTC 持久化 | `lib/time/utc.ts` ↔ `receiptDb.ts` ↔ DB-DESIGN-SPEC §4.1 |
| Snap 脚注 + US 存储文案 | `ComplianceFootnote` ↔ `lib/legal/content.ts` ↔ PRODUCT-SPEC §2.3.2 |
| Privacy & Data 设置区 | `PrivacyDataSection` ↔ PRODUCT-SPEC §2.3.3 |
| `/privacy` `/terms` 路由 + LegalSheet | 已实现 |
| API 契约（目标态）Ghost HMAC | `03-api.md` ↔ api-security ADR |
| PWA / 两逻辑页 / 三态 UI 骨架 | `HomeScreen` ↔ PRODUCT-SPEC §2.1–§5 |

---

## 3. 不一致清单

### 3.1 产品 ↔ 代码（P0 · 阻塞 MVP）

| ID | 产品要求 (PRODUCT-SPEC) | 现状 | 严重度 |
|----|-------------------------|------|--------|
| C1 | §2.2 / §5：联网 Ghost 走 **API + OpenAI**，禁止 mock | `HomeScreen` 调用 `mockProcessReceipt()`；无 `app/api/receipts` | **P0** |
| C2 | §2.4：唯一凭证 **Google** | ~~RegisterBanner 手机号~~ → **Google 软/硬引导已实现** | ~~P0~~ **已关闭** |
| C3 | §2.5：Ghost **HMAC Cookie**；`POST /api/ghost/register` | 无 API；无 `ghostClient` / `ensureGhostSession` | **P0** |
| C4 | §2.3.3：Delete Account 已登录 → `DELETE /api/users/me` | `PrivacyDataSection` 仅 `clearLocalAppData()` + TODO | **P0** |
| C5 | §6 / §11：Paddle 付费 + Export | 无 Paddle / export API / UI 集成 | **P0** |
| C6 | §4.4：Google 登录后 Ghost 小票迁移 | 无 auth API / 无 sync | **P0** |
| C7 | §11：`lib/prisma.ts` 数据访问 | 文件不存在 | **P0** |
| C8 | §5.1：分区域省税 · OpenAI 路径 | `HomeScreen` `×0.25`；无 `tax_amount` 列 | **P0** |

### 3.2 产品 ↔ 技术文档（P1 · 文档债）

| ID | 问题 | 位置 | 严重度 |
|----|------|------|--------|
| D1 | **合规 ADR 仍写 R1 EU/US 分域 + 登录前禁止上云**；与 v1.2「MVP 全美 + Ghost 联网 OpenAI」冲突 | `2026-06-05-compliance-privacy-design.md` §1–§2 | **P1** |
| D2 | Ghost 生命周期图仍 **localStorage + X-Ghost-Id**；§5.8 HMAC 与 §5.2 矛盾 | `05-auth-ghost-google.md` §5.2–5.3 | **P1** |
| D3 | 索引说明仍写「X-Ghost-Id 查绑定」 | `04-data-model.md` §4.4 | **P1** |
| D4 | Auth 仍写 `session OR X-Ghost-Id` | `.cursor/rules/snap1099-backend.mdc` | **P1** |
| D5 | `03-api.md` Google 登录 Header **`X-Ghost-Id`（必填）** 与 api-security「Cookie 优先、Header 仅校验一致」不完全一致 | `03-api.md` §3.1 | **P1** |
| D6 | PRODUCT-SPEC §12 写脚注「待改」；代码已符合 v1.2 文案 | `PRODUCT-SPEC.md` §12 | **P1** |
| D7 | `DB-DESIGN-SPEC` §3.2 仍写客户端 `localStorage` 生成 ghost；与 HMAC register 目标不一致 | `DB-DESIGN-SPEC.md` | **P1** |
| D8 | `DB-DESIGN-SPEC` §4 表仍写「Blob 图片 URL」；应为 pathname | `DB-DESIGN-SPEC.md` §4 | **P2** |
| D9 | `tech/README.md` ADR 索引缺 api-security、db-product-alignment | `docs/tech/README.md` | **P2** |
| D10 | db-product-alignment ADR §2.1 仍写 `TIMESTAMP(3)`（正文 §11 已 TIMESTAMPTZ） | 同 spec 内部 | **P2** |
| D11 | `0.0.1.update.md` 仍提「Ghost 手机号转化率」 | 历史 PRD 附录 | **P2** |

### 3.3 文档 ↔ 代码 / DDL（P2 · 细节）

| ID | 问题 | 位置 | 严重度 |
|----|------|------|--------|
| T1 | `data_region` **VARCHAR(32)** vs spec/Prisma **VARCHAR(8)** | `init-table.sql` L19 vs ADR | **P2** |
| T2 | Mock 分类 `"Truck Gas"` vs AI 枚举 **`TRUCK GAS`** | `mockReceipts.ts` vs `06-receipt-ai-pipeline.md` | **P2** |
| T3 | `02-frontend.md` 状态树含 `ghostId localStorage` 未提 HMAC Cookie | `02-frontend.md` §2.3 | **P2** |
| T4 | compliance ADR 状态「P1–P3 分区域待实施」易误导为当前 MVP 范围 | compliance ADR 头部 | **P1** |

---

## 4. 修改计划

> **原则：** 产品决策以 **PRODUCT-SPEC v1.2** 为准；ADR 标注「路线图」或「已被 v1.2 覆盖」；代码按已有 implementation plan 执行。

### Phase 0 — 文档对齐（1–2 天 · 无运行时变更）

| 序 | 任务 | 产出 |
|----|------|------|
| 0.1 | **合规 ADR 顶部加「MVP 覆盖声明」**：v1.2 下 R1/D1/D3/geo API 为路线图；MVP 行为指向 PRODUCT-SPEC §2.3 | 更新 `2026-06-05-compliance-privacy-design.md` |
| 0.2 | **统一 Ghost 文档**：重写 `05-auth` §5.2 序列为 `POST /api/ghost/register` → Cookie；Google 绑定写 `ghost_account` | `05-auth-ghost-google.md` |
| 0.3 | 同步 `04-data-model`、`DB-DESIGN-SPEC` §3.2/§4、`backend.mdc`：HMAC 为主；`X-Ghost-Id` 仅可选一致性头 | 多文件 |
| 0.4 | 修正 `03-api.md` Google 请求：Cookie `snap1099_ghost` 必填；`X-Ghost-Id` 可选校验 | `03-api.md` |
| 0.5 | 更新 **PRODUCT-SPEC §12** 里程碑：脚注 ✅；列出 API/Google/Paddle 仍为 ❌ | `PRODUCT-SPEC.md` |
| 0.6 | `tech/README.md` 补 ADR：api-security、db-product-alignment | README |
| 0.7 | DDL 小修：`data_region VARCHAR(8)`；db-product-alignment ADR §2.1 改 TIMESTAMPTZ | `init-table.sql` + spec |
| 0.8 | 标注 `0.0.1.update.md` 手机转化率为历史 | PRD 附录注释 |

**验收：** 新人只读 PRODUCT-SPEC + `docs/tech/` 不会误以为 MVP 要 EU 分库或登录前禁止 OpenAI。

---

### Phase 1 — 后端基础（依赖 `2026-06-05-api-security` plan）

| 序 | 任务 | 对齐产品 |
|----|------|----------|
| 1.1 | `lib/prisma.ts` + env 模板 | §11 技术栈 |
| 1.2 | `POST /api/ghost/register` + HMAC middleware | §2.5 |
| 1.3 | `POST/GET /api/receipts` + Blob pathname + OpenAI | §2.2 / §5 |
| 1.4 | 速率限制 + IDOR + 私有 Blob | §2.5 |
| 1.5 | `DELETE /api/users/me` + Ghost 按 id 删 receipts | §2.3.3 |

**验收：** PRODUCT-SPEC §13 清单中 API / Blob / HMAC 项可勾选。

---

### Phase 2 — 前端身份与小票（依赖 Phase 1）

| 序 | 任务 | 对齐产品 |
|----|------|----------|
| 2.1 | ~~删除手机号 RegisterBanner~~ → **Google 软引导** | ✅ 已完成 |
| 2.2 | `lib/storage/ghostClient.ts`：`ensureGhostSession()` | §2.5 |
| 2.3 | `HomeScreen`：在线时 `POST /api/receipts` + 轮询；移除 `mockProcessReceipt` | §5 |
| 2.4 | 离线队列：`online` → upload + `snap_at`/`captured_at` UTC ISO | §2.2 |
| 2.5 | `PrivacyDataSection`：已登录调 `DELETE /api/users/me`；未登录调 Ghost 删 API | §2.3.3 |
| 2.6 | Mock 分类改为 `TRUCK GAS` 等 uppercase 枚举 | §7 / AI pipeline |
| 2.7 | 省税：`taxRegion` · 移除 `×0.25` · 登录 `taxRecalcQueued` | tax spec · **`2026-06-07-mvp-master-implementation.md` Phase 2 |

**验收：** PRODUCT-SPEC §12「未登录联网 OpenAI」「Ghost API」→ ✅。

---

### Phase 3 — Google + Paddle + Export（并行于 2 后期）

| 序 | 任务 | 计划文档 |
|----|------|----------|
| 3.1 | Google OAuth + Ghost 绑定 + receipts 迁移 | google-auth ADR |
| 3.2 | Paddle Webhook + entitlements | paddle ADR |
| 3.3 | Export Tax Pack | `08-export.md` |

**验收：** §12 Google / Paddle 里程碑 ✅。

---

### Phase 4 — 路线图（非 MVP · 仅文档保留）

- EU Frankfurt 分库、`GET /api/geo/region`、双 Vercel Project  
- 保留在 compliance ADR **§Roadmap**，不进入 Phase 1–3 实施范围  

---

## 5. 优先级矩阵

```
         影响 MVP 上线
              ↑
    P0 代码   │  C1–C7  Phase 1–2
    P1 文档   │  D1–D7  Phase 0
    P2 细节   │  T1–T4  Phase 0 顺带
              └────────────────→ 实施成本
```

**建议执行顺序：** **Phase 0 → Phase 1 → Phase 2 → Phase 3**（Phase 0 可与 Phase 1 文档部分并行）。

---

## 6. 不在本次修改计划内

- 新增产品功能（超出 PRODUCT-SPEC v1.2）
- EU 分区域基础设施实施
- Prisma 7 升级
- 重命名 `image_url` → `blob_path`

---

## 7. 相关计划索引

| 计划 | 覆盖 Phase |
|------|------------|
| [**2026-06-07-mvp-master-implementation.md**](../plans/2026-06-07-mvp-master-implementation.md) | **0–3 总编排** |
| [2026-06-05-api-security.md](../plans/2026-06-05-api-security.md) | 1 |
| [2026-06-07-tax-savings-regional.md](../plans/2026-06-07-tax-savings-regional.md) | 1–2 |
| [2026-06-06-logging.md](../plans/2026-06-06-logging.md) | 1 |
| [2026-06-05-db-product-alignment.md](../plans/2026-06-05-db-product-alignment.md) | 已完成 DDL 基线 |
| google-auth / paddle ADR | 3 |

**变更流程：** 本审计批准 → Phase 0 文档 PR → Phase 1+ 按既有 implementation plan 执行。
