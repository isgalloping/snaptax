# 03 — API 契约

Base URL: `https://{domain}/api`  
认证：Cookie `snap1099_session`（Google 登录后）或 Cookie/Header **Ghost HMAC token**（`snap1099_ghost`）。`X-Ghost-Id` 仅作与 token 一致性的辅助校验，**不可单独作为信任依据**。详见 [API 安全设计](../superpowers/specs/2026-06-05-api-security-design.md)。

## 3.1 认证

### `POST /api/ghost/register`

首次联网时登记 Ghost；返回 HMAC 签名 token（HttpOnly Cookie）。

**Response 201**
```json
{ "ghostId": "..." }
```

### `POST /api/auth/google`

绑定 Google 账户并静默关联 Ghost。

**Request**
```json
{ "credential": "<Google ID Token JWT>" }
```
Cookie: **`snap1099_ghost`**（必填，HMAC Ghost token）  
Cookie: **`snap1099_ghost`**（必填，HMAC Ghost token）  
Header: `X-Ghost-Id`（可选；若存在须与 Cookie token 内 `ghostId` 一致）  
Header: **`X-Tax-Region`**（`us` \| `eu`；与客户端 `snap1099_region_candidate` 一致，用于锁定 `users.data_region`）

**Response 200**
```json
{
  "user": { "id": "usr_...", "email": "user@gmail.com", "dataRegion": "eu" },
  "bound": true,
  "taxRecalcQueued": 0
}
```

`taxRecalcQueued`：登录锁定区与 Ghost 语言候选区 **不一致** 时为待 OpenAI 重算张数；一致为 `0`。详见 [省税设计](../superpowers/specs/2026-06-07-tax-savings-regional-design.md)。

### `POST /api/auth/logout`

清除 session cookie 与 ghost cookie（登出后客户端应 `POST /api/ghost/register` 获取新 Ghost）。

### `GET /api/auth/me`

**Response 200**
```json
{
  "user": { "id": "...", "email": "...", "industry": "electrician" } | null,
  "ghostId": "..."
}
```

---

## 3.2 用户偏好

### `PATCH /api/users/me`

```json
{ "industry": "truck_driver" }
```

---

## 3.3 小票

### `GET /api/receipts`

Query: `limit=3`（默认最近 3 条）

**Response 200**
```json
{
  "receipts": [
    {
      "id": "rcpt_...",
      "status": "done",
      "amount": 45.2,
      "merchant": "Shell Gas",
      "category": "TRUCK GAS",
      "deductible": true,
      "taxAmount": 11.30,
      "dataRegion": "us",
      "capturedAt": "2026-06-05T11:30:00Z"
    }
  ],
  "taxSavedEstimate": 1420.5
}
```

`taxSavedEstimate` = `SUM(tax_amount)` where `status=done`。**禁止** 客户端 `amount×0.25`。

### `GET /api/receipts/sync`

分页拉取小票元数据（换机恢复 / cloud restore）。Auth：Ghost HMAC 或 Google session；`receiptWhereForActor`。

Query:

| 参数 | 说明 |
|------|------|
| `since` | UTC ISO 8601（须含 `Z` 或 offset）；缺省 = now − **18 months** |
| `cursor` | opaque keyset cursor（`updatedAt` + `id`，base64url JSON） |
| `limit` | 每页条数，1–50，缺省 50 |

**Response 200**
```json
{
  "receipts": [ { "id": "rcpt_...", "status": "done", "updatedAt": "2026-06-05T11:30:00.000Z", "...": "..." } ],
  "nextCursor": "eyJ1cGRhdGVkQXQiOi...",
  "hasMore": true
}
```

- 排序：`updatedAt desc`, `id desc`（keyset pagination）
- 过滤：`captured_at >= since`
- **不**返回 Blob bytes；图片走 `GET /api/receipts/:id/image`

### `POST /api/receipts`

`multipart/form-data`: `file` (image/jpeg) · 可选 `ocrDraft`（JSON string，客户端本地 OCR 草稿）

| 客户端 payload | 服务端 |
|----------------|--------|
| 仅 `file` | Path B · Vision（100% 现网） |
| `file` + `ocrDraft` 且 gate 通过 | Path A · `classifyReceiptText`；失败则 Vision |
| `file` + `ocrDraft` 且 gate 失败 | Path B · Vision |

Header: **`snap1099_ghost` Cookie**（Ghost）或 session  
Header: **`X-Tax-Region`**（`us` \| `eu`；缺省 `us`）→ 写入 `receipt.data_region`

**Response 201**
```json
{ "id": "rcpt_...", "status": "processing" }
```

### `GET /api/receipts/:id`

轮询 AI 结果。

### `POST /api/receipts/:id/process`

触发 OpenAI（若创建时未 inline 处理）。内部或客户端在 upload 后调用。

### `DELETE /api/receipts/:id`

重拍前删除 blurry 记录（可选）。

### `POST /api/sync/events`

客户端生命周期事件 batch 上传（append-only · shipped 2026-07-10）。

Header: **`snap1099_ghost` Cookie**（Ghost）或 session  
Rate limit: IP **60/min** · Ghost **30/h** · User **60/h**（`SYNC_EVENTS_*` 可覆盖）

**Request**
```json
{
  "events": [
    {
      "id": "uuid",
      "receiptId": "uuid",
      "type": "RECEIPT_CREATED",
      "payload": { "pendingUpload": true },
      "createdAtMs": 1700000000000
    }
  ]
}
```

| 字段 | 约束 |
|------|------|
| `events` | 1–50 条（`RECEIPT_EVENT_BATCH_SIZE`） |
| `type` | `RECEIPT_CREATED` · `OCR_COMPLETED` · `TAX_CALCULATED` |
| `TAX_CALCULATED` | 须引用当前 actor 名下 receipt，否则 **403** `INVALID_RECEIPT` |

**Response 200**
```json
{
  "syncedIds": ["uuid", "..."],
  "inserted": 3,
  "snapshotsInserted": 1,
  "cursor": {
    "lastEventId": "uuid",
    "lastClientCreatedAtMs": 1700000000000
  }
}
```

服务端 `createMany({ skipDuplicates: true })` — 客户端 event `id` 幂等。`TAX_CALCULATED` 同时 append `snaptax_receipt_lifecycle_snapshots`（`source_event_id` 幂等）。ingest 后更新 actor `snaptax_receipt_sync_cursors`；采样 lazy GC 删除 `client_created_at` 超过 **18 个月**的事件。

| HTTP | `error.code` | 说明 |
|------|--------------|------|
| 400 | `INVALID_BODY` | batch 空/超长、字段非法 |
| 403 | `INVALID_RECEIPT` | `TAX_CALCULATED` 引用非 actor 名下 receipt |
| 429 | `RATE_LIMITED` | IP 或 actor 超 `SYNC_EVENTS_*` 限额 |
| 401 | `UNAUTHORIZED` | 无有效 Ghost cookie / session |

### `GET /api/sync/events/cursor`

返回当前 actor 的服务端 sync cursor（无则 `cursor: null`）。继承 session/Ghost auth，无额外 rate limit。

**Response 200**
```json
{
  "cursor": {
    "lastEventId": "uuid",
    "lastClientCreatedAtMs": 1700000000000
  }
}
```

客户端 flush 成功后亦写入 `snaptax_system_meta.receipt_event_sync_cursor`。

---

## 3.4 权益

### `GET /api/entitlements/current`

Query: `season=2026`（默认当前报税季）

**Response 200**
```json
{
  "season": "2026",
  "paid": true,
  "paidAt": "2026-02-01T..."
}
```

---

## 3.5 导出

### `POST /api/export/tax-pack`

需：Google session + 本季 `paid: true`

**Request header（可选）：** `X-Time-Zone: America/New_York` — 客户端 `Intl.DateTimeFormat().resolvedOptions().timeZone`；缺省或非法值时导出列使用 UTC。

**Response 200**
```json
{
  "downloadUrl": "https://...",
  "filename": "SnapTax-2026-Tax-Pack.xlsx",
  "expiresAt": "..."
}
```

客户端 fetch blob → `navigator.share`。

---

## 3.6 Webhook

### `POST /api/webhooks/paddle`

Paddle 签名验证；事件 `transaction.completed` → upsert `season_entitlements`。

---

## 3.7 错误格式

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Google login required"
  }
}
```

| HTTP | code | 场景 |
|------|------|------|
| 401 | UNAUTHORIZED | 未登录 |
| 402 | PAYMENT_REQUIRED | 导出未付费 |
| 422 | BLURRY | 客户端可提示重拍 |
| 429 | RATE_LIMITED | 上传/登录超频 |
| 500 | INTERNAL | 服务端错误 |

---

## 3.8 安全（摘要）

> 完整威胁模型与 MVP 清单：[2026-06-05-api-security-design.md](../superpowers/specs/2026-06-05-api-security-design.md)

| 领域 | MVP 要求 |
|------|----------|
| Ghost | HMAC Cookie；`POST /api/ghost/register`；绑定 Google 后写操作须 Session |
| 上传 | JPEG/PNG 魔数；≤5MB；Ghost 10/h、User 30/h |
| 授权 | 所有 `:id` 路由校验归属；失败 **404** |
| OpenAI | 仅服务端；禁止客户端 `image_url`；JSON schema |
| Blob | Private + signed URL ≤15min |
| Secrets | 不进客户端；禁止 `NEXT_PUBLIC_OPENAI_*` |
