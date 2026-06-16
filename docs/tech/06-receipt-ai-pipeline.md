# 06 — 小票 AI 流水线

> **省税 Canonical：** [2026-06-07-tax-savings-regional-design.md](../superpowers/specs/2026-06-07-tax-savings-regional-design.md) · 唯一入口 **`processReceiptTax`**

## 6.1 概述

上传小票 JPEG → Vercel Blob → OpenAI GPT-4o Vision（**US 或 EU prompt**，由 `receipt.data_region`）→ Zod → **`computeTaxAmount`** → 更新 `receipts`（含 **`tax_amount`**）

## 6.2 状态机

```
                    ┌─────────────┐
         拍照/upload │ processing  │
                    └──────┬──────┘
                           │ OpenAI
              ┌────────────┼────────────┐
              ▼                         ▼
        ┌──────────┐              ┌──────────┐
        │   done   │              │  blurry  │
        └──────────┘              └──────────┘
```

| status | UI | 条件 |
|--------|-----|------|
| processing | Processing... / Uploading | 默认 upload 后 |
| done | $金额 + 标签 | confidence ≥ 0.7 且 amount 有效 |
| blurry | Receipt blurry. Tap to resnap | 否则 |

## 6.3 OpenAI 调用

**Model:** `gpt-4o`（Vision）

**Input:** 从 DB 读取 `image_url`（pathname）→ signed URL 或 upload base64

**分支：** `data_region === 'eu'` → EU prompt（强制 `vat_rate` / `vat_amount`）；否则 US prompt（`deduction_ratio`）

### US Response schema

```json
{
  "amount": 45.20,
  "merchant": "Shell",
  "category": "TRUCK GAS",
  "deductible": true,
  "deduction_ratio": 1.0,
  "confidence": 0.92
}
```

服务端：`tax_amount = amount × deduction_ratio × TAX_US_MARGINAL_RATE`（`deductible=false` → 0）

### EU Response schema

```json
{
  "amount": 119.00,
  "currency": "EUR",
  "merchant": "REWE",
  "category": "SUPPLIES",
  "deductible": true,
  "vat_rate": 0.19,
  "vat_amount": 19.00,
  "confidence": 0.90
}
```

服务端：`tax_amount = vat_amount`（`deductible=false` → 0）

**禁止：** 无 Vision 更新 `tax_amount`；登录 region 一致时不得批量重算。

## 6.4 处理触发

**MVP（当前）：** `POST /api/receipts` 内 await OpenAI；Vision 失败时仍返回 **201** `{ status: "processing", processFailed: true }`（Blob + DB 已持久化）。

客户端通过 `POST /api/receipts/:id/process` 重试；poll 超时后自动触发一次 `/process`。

**方案 B（后续）：** upload 返回 `processing` → 异步 QStash/Inngest 调 `/process`

## 6.5 客户端轮询与恢复

**策略（2026-06-07）：** 见 [background-polling-policy-design.md](../superpowers/specs/2026-06-07-background-polling-policy-design.md)

- **Phase 1 启动：** IndexedDB → 本地 list 即时展示（不等 network）；auth 仍等 `fetchAuthMe`；**不 poll**
- **Phase 2 延迟：** `requestAnimationFrame` 后 ghost session + flush pending + list refresh → merge（相机开则推迟 merge）；`ProcessingQueue.bootstrap`
- **Phase 3 后台：** 单线程 FIFO 队列，watcher 同一时刻只 watch 1 条；`GET /api/receipts` 每 3s（仅 active id 存在且未 pause）
- **Pause：** 相机 / 详情 Sheet / Settings / `document.hidden` → 零 poll；无 processing 时停止 timer
- **Retry：** 用户点击 → `POST /process` + `tickOnce`（可穿透 pause）
- **Pending upload：** 在线且可见时每 60s 重试；syncStuck 时跳过；不触发 list poll

### Write budget（2026-06-07）

见 [receipt-sync-budget-design.md](../superpowers/specs/2026-06-07-receipt-sync-budget-design.md)

- 单票 `writeBudgetRemaining` 默认 5，IndexedDB 持久化
- 仅失败写操作扣次：`POST /receipts`、`POST /process`；`GET /api/receipts` 不计
- 用尽 → `syncStuck` → Tap to Retry 重置为 5
- 顶栏刷新按钮：手动 list 同步，不扣单票 budget

## 6.6 错误处理

| 错误 | 行为 |
|------|------|
| OpenAI 429/5xx/timeout（upload 内） | 201 processing；客户端 poll + `/process` 重试 |
| OpenAI 失败（`/process`） | 200 processing + `processFailed: true` |
| 最终仍 processing | 保持 processing；用户可手动 Retry |
| 私人消费 | deductible=false，UI 标签 Personal (Non-Deductible) |

## 6.7 环境变量

```
OPENAI_API_KEY=
OPENAI_BASE_URL=          # optional; e.g. https://maxapi.pro/v1 for OpenAI-compatible gateways
OPENAI_MODEL=gpt-4o-mini  # production via Max API Pro: gpt-5.4-mini (use console slug)
OPENAI_TIMEOUT_MS=120000
OPENAI_MAX_RETRIES=2
RECEIPT_CONFIDENCE_THRESHOLD=0.7
```

**Max API Pro ([maxapi.pro](https://maxapi.pro)):** set `OPENAI_BASE_URL`, gateway API key, and `OPENAI_MODEL=gpt-5.4-mini`. Prompts, Zod, and tax math unchanged.

## 6.8 成本监控

- 记录 `ai_raw` jsonb + token usage 日志
- Vercel Log Drain 或 Axiom 统计每张成本

## 6.9 安全边界

> 详见 [API 安全设计](../superpowers/specs/2026-06-05-api-security-design.md)

- OpenAI 调用 **仅** Route Handler / Server Action；`OPENAI_API_KEY` 不得出现在客户端 bundle
- 图像输入：**服务端** base64 或 **自签 Blob signed URL**；**禁止**接受客户端传入的任意 URL（防 SSRF）
- 输出：`response_format: json_object` + Zod 校验；解析失败 → `blurry`
- 每张小票默认 **一次** Vision 调用；重复 `process` 须 idempotency
- 日志不记录原图 base64 或完整 AI 响应正文
- Ghost 上传受速率限制（10/h）与 OpenAI 全局熔断保护
