# 06 — 小票 AI 流水线

## 6.1 概述

上传小票 JPEG → Vercel Blob → OpenAI GPT-4o Vision → 结构化 JSON → 更新 `receipts.status`

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

**Input:** 从 DB 读取 `image_url`（pathname）→ `getDownloadUrl(pathname)` 得短期 signed URL；或 upload 流程内 base64

**System Prompt 要点：**
- 北美收据 OCR
- 输出 **仅 JSON**，无 markdown
- 字段：amount, merchant, category, deductible, confidence
- category 枚举：TRUCK GAS, TOOLS, SUPPLIES, EQUIPMENT, MATERIALS, PERSONAL, OTHER
- industry 上下文可选注入用户 `industry`

**Response schema:**
```json
{
  "amount": 45.20,
  "merchant": "Shell",
  "category": "TRUCK GAS",
  "deductible": true,
  "confidence": 0.92
}
```

## 6.4 处理触发

**MVP 方案 A（简单）：** `POST /api/receipts` 内 await OpenAI（设置 `maxDuration=60` on Vercel Pro）

**方案 B（推荐生产）：** upload 返回 `processing` → 异步 QStash/Inngest 调 `/api/receipts/:id/process`

MVP 可先 A，文档预留 B 接口。

## 6.5 客户端轮询

```
GET /api/receipts/:id every 2s, max 30 attempts
```

离线：不调 API；`online` 后 resume。

## 6.6 错误处理

| 错误 | 行为 |
|------|------|
| OpenAI 429/5xx | 保持 processing，后台 retry 3 次 |
| 最终失败 | status 保持 processing + 客户端显示重试（非 Modal） |
| 私人消费 | deductible=false，UI 标签 Personal (Non-Deductible) |

## 6.7 环境变量

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
RECEIPT_CONFIDENCE_THRESHOLD=0.7
```

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
