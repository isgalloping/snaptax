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
Header: `X-Ghost-Id`（可选；若存在须与 Cookie token 内 `ghostId` 一致）

**Response 200**
```json
{
  "user": { "id": "usr_...", "email": "user@gmail.com" },
  "bound": true
}
```

### `POST /api/auth/logout`

清除 session cookie。

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
      "capturedAt": "2026-06-05T11:30:00Z"
    }
  ],
  "taxSavedEstimate": 1420.5
}
```

### `POST /api/receipts`

`multipart/form-data`: `file` (image/jpeg)

Header: session 或 `X-Ghost-Id`

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

**Response 200**
```json
{
  "downloadUrl": "https://...",
  "filename": "Snap1099-2026-Tax-Pack.xlsx",
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
