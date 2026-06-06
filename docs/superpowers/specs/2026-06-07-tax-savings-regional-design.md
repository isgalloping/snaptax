# Snap1099 分区域省税估算设计（US / EU）

**日期：** 2026-06-07  
**状态：** 已批准  
**依据：** `docs/product/PRODUCT-SPEC.md` v1.2 · `docs/tech/06-receipt-ai-pipeline.md` · `docs/legal/terms.md`（非税务建议）

---

## 1. 目标

为主界面 **Est. Tax Saved** 提供分区域、可审计的估算逻辑：

| 区域 | 语义 | 用户价值 |
|------|------|----------|
| **US** | 符合 IRS 习惯的 **可抵扣税基 × 边际税率** | 1099 自雇工「大概能少交多少联邦税」 |
| **EU** | 可抵扣商业小票的 **进项 VAT（Input VAT）** | 下季度可向税务局要回/抵扣的 VAT 现金 |

**铁律：**

- 顶栏数字 = **`SUM(tax_amount)`**（`status=done`），不在客户端 `×0.25` 硬编码。
- **省税唯一路径 — OpenAI Vision：** 任意 `tax_amount` 的新增/变更 **必须** 经 **OpenAI 读图流水线**（`processReceiptVision`）；**禁止** 仅用库内 `amount`/`category`/`ai_raw` 做公式重算而 **不重新调用 OpenAI**。
- OpenAI 返回结构化字段 → 服务端 Zod 校验 → **`computeTaxAmount`** 写入 `tax_amount`（数值公式在服务端，输入 **必须** 来自当次 OpenAI 响应）。
- **`data_region` 表示税法计算辖区**，与 MVP **物理数据驻留（美国单库）** 解耦；Privacy 美国处理告知不变。
- 文案仍为 **Est.**；Terms 保留「非税务建议」。

### 1.1 锁定决策

| 决策点 | 选择 |
|--------|------|
| Ghost 未登录 `data_region` | **R1** — `Accept-Language` 启发式 → `localStorage.snap1099_region_candidate`；上传/API 时传给服务端写入 `receipt.data_region` |
| Google 登录后 | 锁定 `users.data_region`；**仅当** 锁定区与 Ghost 期 **`X-Tax-Region`/语言候选区不一致** 时，对历史小票 **OpenAI 重算**（见 §4.3） |
| 省税计算路径 | **仅 OpenAI Vision** → Zod → `computeTaxAmount`；禁止无 Vision 的 DB 重算 |
| US 边际税率 MVP | **25%** — env `TAX_US_MARGINAL_RATE=0.25` |
| EU 省税口径 MVP | **`tax_amount = vat_amount`**（`deductible=true` 时） |
| 表变更 | `snaptax_receipts.tax_amount`、`snaptax_receipts.data_region`（冗余快照） |
| 中间字段 | `deduction_ratio`、`vat_rate`、`vat_amount` 等进 **`ai_raw` JSONB**；Export 可读 |

---

## 2. 美国计算（`data_region = us`）

### 2.1 公式

单张 `done` 小票：

```
deductible_base = amount × deduction_ratio
tax_amount      = deductible ? round2(deductible_base × TAX_US_MARGINAL_RATE) : 0
```

其中 `deduction_ratio ∈ [0, 1]`，由 OpenAI 建议 + 服务端 IRS 科目表兜底。

**顶栏：**

```
Est. Tax Saved = SUM(tax_amount) WHERE status = 'done' AND ghost/user 归属当前 actor
```

### 2.2 OpenAI 输出（US schema）

| 字段 | 类型 | 说明 |
|------|------|------|
| `amount` | number | 小票金额（USD） |
| `merchant` | string | 商户 |
| `category` | string | TRUCK GAS, TOOLS, MEALS, PERSONAL, … |
| `deductible` | boolean | 是否商业可抵扣 |
| `deduction_ratio` | number | 0 / 0.5 / 1.0 |
| `confidence` | number | 0–1 |

### 2.3 科目抵扣比例兜底表（服务端 `lib/tax/usCategories.ts`）

| category | deduction_ratio | 备注 |
|----------|-----------------|------|
| TRUCK GAS, TOOLS, SUPPLIES, EQUIPMENT, MATERIALS, OTHER | 1.0 | Schedule C 常见 100% |
| MEALS | 0.5 | IRS 商务餐 50% |
| PERSONAL | 0 | 强制 `deductible=false` |

AI 返回的 `deduction_ratio` 若与表冲突，**以表为准**（更保守侧：取 `min`）。

---

## 3. 欧盟计算（`data_region = eu`）

### 3.1 公式

```
tax_amount = deductible ? round2(vat_amount) : 0
```

顶栏同样 **`SUM(tax_amount)`**；对用户展示为「Est. Tax Saved」（MVP 不拆 VAT 专用标题；Export Summary 可用 **Est. VAT Recoverable** 副标题）。

### 3.2 OpenAI 输出（EU schema）

| 字段 | 类型 | 说明 |
|------|------|------|
| `amount` | number | 含税总额（gross） |
| `currency` | string | EUR 等 |
| `merchant` | string | |
| `category` | string | 商业类别 |
| `deductible` | boolean | **更严** — 私人/混合消费 false |
| `vat_rate` | number \| null | 如 0.19、0.07；小票无 VAT 行则 null |
| `vat_amount` | number \| null | 进项 VAT 绝对值 |
| `confidence` | number | |

**规则：**

- 小票可见 VAT 行时 **必须** 提取 `vat_rate` + `vat_amount`。
- `vat_amount` 缺失但 `amount`+`vat_rate` 有 → 服务端按 `amount × rate / (1+rate)` 估算（写入 `ai_raw.computed_vat=true`）。
- `deductible=false` → `tax_amount=0`，顶栏不增加。

---

## 4. R1 — Ghost 区域候选（`data_region` 来源）

### 4.1 客户端

**存储键（已有）：** `localStorage.snap1099_region_candidate` → `"us"` | `"eu"`

**初始化（App 首次 hydration，仅当 key 不存在）：**

```typescript
function inferTaxRegionCandidate(): "us" | "eu" {
  const langs = navigator.languages ?? [navigator.language];
  for (const tag of langs) {
    const base = tag.split("-")[0].toLowerCase();
    if (["de", "fr", "it", "es", "nl", "pl", "pt", "sv", "da", "fi", "el", "cs", "ro", "hu", "sk", "bg", "hr", "sl", "et", "lv", "lt", "mt", "ga"].includes(base)) {
      return "eu";
    }
  }
  return "us";
}
```

**上传小票时：** `POST /api/receipts` 带 Header **`X-Tax-Region: us|eu`**（须与 localStorage candidate 一致）或 form field `taxRegion`。

**路线图（非 MVP）：** `GET /api/geo/region`  refine candidate；MVP 不实现。

### 4.2 服务端

1. `POST /api/receipts` 解析 `X-Tax-Region`，校验 `us|eu`，写入 receipt 初始 `data_region`（processing 态即可落库）。
2. OpenAI 流水线使用 receipt.`data_region` 选 Prompt / schema。
3. 计算 `tax_amount` 后 UPDATE receipt。

### 4.3 Google 登录锁定与历史小票重算

`POST /api/auth/google` 成功并完成 Ghost 绑定 / `receipts.user_id` 迁移后：

1. **锁定区域：**  
   - `lockedRegion` = Header **`X-Tax-Region`**（`us` \| `eu`，缺省 `us`）  
   - 写入 `users.data_region = lockedRegion`，`data_region_locked_at = now()`
2. **Ghost 候选区（未登录语言区）：**  
   - `ghostCandidate` = 客户端随登录请求提交的 **`X-Tax-Region`**（须与 `localStorage.snap1099_region_candidate` 一致；即 R1 语言启发式结果）  
   - 服务端 **不信任** 自报时，可用该 Ghost 下已有小票的 **`mode(receipt.data_region)`** 作交叉校验；二者冲突时 **以已有小票多数 `data_region` 为 ghostCandidate** 并 log warn
3. **是否重算（核心规则）：**

```
if (lockedRegion === ghostCandidate) {
  taxRecalcQueued = 0   // 登录确定区与未登录语言区一致 → 不重算
} else {
  taxRecalcQueued = count(该 ghost/user 下 status IN ('done','processing') 且 image_url 有效的小票)
  → 逐张 OpenAI 重算（§4.4），dataRegion = lockedRegion
}
```

**一致则跳过：** Ghost 期小票已在正确 US/EU Prompt 下完成 Vision，`tax_amount` 有效，**仅** 做 `user_id` 迁移与 `users.data_region` 锁定，**不** 再次调用 OpenAI。

**不一致则重算：** 例如 Ghost 期按 `us` 处理、登录锁定为 `eu`（或反之）→ 必须对历史小票 **每张重新 Vision**。

4. **响应：** `200` 立即返回；`taxRecalcQueued` 为 **0 或 N**；N>0 时重算 **异步**（MVP：`waitUntil` / 后台 Promise）。
5. **客户端：** 仅当 `taxRecalcQueued > 0` 时轮询 `GET /api/receipts`；为 0 时直接刷新列表即可。

### 4.4 OpenAI 省税流水线（唯一入口）

**函数：** `lib/receipts/processReceiptTax.ts` → 内部 **仅** 调用 `processReceiptVision(blob, dataRegion, industry?)`

```
Blob pathname → signed URL / buffer
             → OpenAI Vision（US 或 EU prompt）
             → Zod 校验
             → computeTaxAmount(region, aiFields)
             → UPDATE snaptax_receipts SET
                 amount, category, deductible, tax_amount, data_region,
                 ai_raw, status, processed_at
```

**适用场景（均走同一路径）：**

| 场景 | data_region 来源 |
|------|------------------|
| 首次上传 `POST /api/receipts` | Header `X-Tax-Region` |
| 登录后历史重算（**仅 region 不一致**） | **`users.data_region`（锁定值）** |
| 用户 Tap to resnap / 手动重试 | 当前 actor 的 effective region（已登录 → user；Ghost → Header） |

**禁止：**

- `UPDATE tax_amount = f(amount, category)` 而无 OpenAI 调用
- 登录后仅 `UPDATE data_region` 不 Vision
- 客户端计算省税并写库

**幂等 / 限流：** 重算任务带 `receiptId` 锁；同一小票并发 process 仅一条；OpenAI 全局熔断与 Ghost 限流仍适用（登录批量重算可放宽为 **user** 维度 30/h，见 api-security ADR）。

---

## 5. 数据模型

### 5.1 `snaptax_receipts` 新增列

| 列 | 类型 | 默认 | 说明 |
|----|------|------|------|
| `tax_amount` | NUMERIC(10,2) NOT NULL | 0 | 该张估算省税（US/EU 语义见 §2–§3） |
| `data_region` | VARCHAR(8) NOT NULL | `'us'` | 处理时税法辖区快照：`us` \| `eu` |

**Prisma / `init-table.sql` / `DB-DESIGN-SPEC` / `04-data-model.md` 同步。**

### 5.2 `ai_raw` 扩展示例

**US:**

```json
{
  "region": "us",
  "deduction_ratio": 1,
  "marginal_rate": 0.25,
  "deductible_base": 45.2,
  "model": "gpt-4o"
}
```

**EU:**

```json
{
  "region": "eu",
  "vat_rate": 0.19,
  "vat_amount": 7.22,
  "computed_vat": false,
  "model": "gpt-4o"
}
```

---

## 6. API

### 6.1 `GET /api/receipts`

```json
{
  "receipts": [ { "id": "...", "taxAmount": 11.30, "dataRegion": "us", ... } ],
  "taxSavedEstimate": 1420.50
}
```

`taxSavedEstimate` = `SUM(tax_amount)`（done，当前 actor 归属）。

### 6.2 `GET /api/receipts/:id`

含 `taxAmount`、`dataRegion`（done 后）。

### 6.3 Headers（Ghost / 未登录）

| Header | 必填 | 说明 |
|--------|------|------|
| `X-Tax-Region` | 推荐 | `us` \| `eu`；缺省 `us` |

### 6.4 `POST /api/auth/google` Response 增补

```json
{
  "user": { "id": "...", "email": "...", "dataRegion": "eu" },
  "bound": true,
  "taxRecalcQueued": 12
}
```

`taxRecalcQueued` = 已排队 OpenAI 重算的小票数量；**region 一致时为 `0`**。

### 6.5 内部：`enqueueReceiptTaxRecalc(userId, dataRegion)`

- 由 `auth/google` 调用；不暴露公开批量端点（MVP）。
- 日志：`biz.openai` + `meta.receiptId` + `meta.reason=login_recalc`。

---

## 7. 客户端 UI

| 组件 | 行为 |
|------|------|
| `TaxHeader` | 展示 API `taxSavedEstimate`；禁止本地 `amount×0.25` |
| `HomeScreen` | …；**仅 `taxRecalcQueued > 0`** 时轮询直至重算完成 |
| 登录后重算 | 小票重算中可显示 `Processing...`（`status=processing`）；**禁止** 本地估算顶栏 |
| 离线 | 不调用 OpenAI；**不更新** `tax_amount`；联网 sync 后以服务端为准 |

**Disclaimer（可选 MVP）：** Settings → Data storage 下方一行小字 *Estimates only, not tax advice.*

---

## 8. Export（`08-export.md` 对齐）

**Sheet Summary 增补：**

| 字段 | US | EU |
|------|----|----|
| Tax Region | US | EU |
| Est. Tax Saved | SUM(tax_amount) | SUM(tax_amount)（VAT recoverable） |

**Sheet Expenses 增列：** `Tax Amount` · `Data Region` ·（EU 可选）`VAT Rate` / `VAT Amount` 从 `ai_raw` 展开。

---

## 9. 模块结构（实施）

```
lib/tax/
├── types.ts           # TaxRegion, UsAiFields, EuAiFields
├── inferRegion.ts     # 客户端 inferTaxRegionCandidate
├── usCategories.ts    # IRS 科目 ratio 表
├── computeUs.ts       # computeUsTaxAmount
├── computeEu.ts       # computeEuTaxAmount
├── computeTaxAmount.ts # dispatch by region
└── aggregate.ts       # sumTaxSaved(receipts)

lib/receipts/
├── processReceiptTax.ts   # 唯一省税入口：Blob → Vision → compute → DB
└── enqueueTaxRecalc.ts    # 登录后批量排队

lib/openai/
├── prompts/usReceipt.ts
├── prompts/euReceipt.ts
└── receiptVision.ts   # 分支 + Zod + 调 computeTaxAmount
```

---

## 10. 测试要点

| 用例 | 期望 |
|------|------|
| US TRUCK GAS $100, ratio 1.0 | tax_amount = 25.00 |
| US MEALS $100 | tax_amount = 12.50 |
| US PERSONAL | tax_amount = 0 |
| EU VAT €19 on €119, deductible | tax_amount = 19.00 |
| EU private grocery | tax_amount = 0 |
| `Accept-Language: de-DE` | candidate = eu |
| 登录后 region 一致 | `taxRecalcQueued=0`，无额外 OpenAI 调用 |
| 登录后 us→eu 不一致 | 历史小票 N 次 Vision，`data_region` 更新为 `eu` |
| 无 Vision 的 tax 更新 | **禁止** — 单测/审查拦截 |

---

## 11. 不在 MVP 范围

- 成员国差异化 VAT 规则引擎（除 OpenAI 提取 + 保守 deductible）
- US 联邦+州分项税率、Quarterly estimated tax
- 物理 EU 分库（Frankfurt）

---

## 12. 相关文档

| 文档 | 变更 |
|------|------|
| `PRODUCT-SPEC.md` | §5.1 省税估算 |
| `06-receipt-ai-pipeline.md` | 分 region schema |
| `03-api.md` | taxSavedEstimate、`X-Tax-Region` |
| `08-export.md` | Summary / Expenses 列 |
| MVP 总路线图 | Phase 1.6 引用本 spec |

**变更流程：** 产品决策 → **本 spec** → DDL → `lib/tax/*` → OpenAI → 前端顶栏

---

## 13. 实施

见 [`docs/superpowers/plans/2026-06-07-tax-savings-regional.md`](../plans/2026-06-07-tax-savings-regional.md)。
