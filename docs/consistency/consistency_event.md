# SnapTax：OCR → OpenAI 抵税计算完整技术方案（PWA Offline-First）

版本：v1.0
目标用户：美国 1099 Contractor / 蓝领工人（Construction、Plumbing、HVAC、Electrician、Landscaping 等）
技术栈：PWA + Next.js + IndexedDB + OpenAI
核心目标：

✓ 离线优先（Offline First）
✓ 1.5 年数据一致性
✓ 不影响连续拍照
✓ 极低成本
✓ 秒级返回抵税结果
✓ IRS Schedule C 自动分类

---

# 一、整体架构

```text
┌─────────────────────────────┐
│          SnapTax PWA        │
│     (IndexedDB + Worker)    │
└─────────────┬───────────────┘
              │
              ▼
       Receipt Capture
              │
              ▼
       IndexedDB Save
              │
              ▼
       Local OCR Engine
    (ONNX/Tesseract WASM)
              │
      ┌───────┴────────┐
      │                │
      │成功            │失败
      ▼                ▼
 Local Text       OpenAI Vision
 Extraction         Fallback
      │                │
      └───────┬────────┘
              ▼
       Structured Receipt
              │
              ▼
      GPT Tax Classification
              │
              ▼
      Deduction Calculation
              │
              ▼
       Save IndexedDB
              │
              ▼
         Event Queue
              │
              ▼
         Background Sync
              │
              ▼
         Next.js API
              │
              ▼
         Event Store
```

---

# 二、用户完整流程

## Step 1：用户拍照

用户点击：

```text
Scan Receipt
```

执行：

```typescript
capture()
↓
receipt_id = uuid()
↓
save IndexedDB
↓
append RECEIPT_CREATED Event
```

状态：

```text
RAW
```

立即返回 UI：

```text
✓ Saved Offline
```

耗时：

```text
<100ms
```

---

# 三、本地 OCR 流程

## 图片预处理

Worker 中执行：

```typescript
resize → 1280px
quality → 0.7
crop → ROI
```

目的：

- 降低 OCR 时间
- 降低内存占用
- 提高识别率

耗时：

```text
50~100ms
```

---

## Local OCR

推荐：

### 主方案：

```text
ONNX Runtime Web
```

备用：

```text
Tesseract.js
```

输出：

```json
{
  "text":"WALMART STORE #4215 ... TOTAL 45.22",
  "confidence":0.89
}
```

耗时：

```text
300~800ms
```

---

# 四、OCR Fallback 策略

若满足：

```text
confidence < 0.6
```

或者：

```text
merchant missing
total missing
乱码比例 > 50%
```

进入：

```text
OpenAI Vision
```

流程：

```text
OCR_FAILED
↓
VISION_FALLBACK_STARTED
↓
OpenAI Vision
↓
OCR_COMPLETED
```

OpenAI 输出：

```json
{
  "merchant":"Shell",
  "date":"2026-06-20",
  "total":72.14,
  "items":[]
}
```

触发比例：

```text
1%~5%
```

---

# 五、结构化抽取

Local OCR 或 Vision 输出后：

执行：

```typescript
parseReceipt()
```

提取：

```json
{
  "merchant":"Walmart",
  "date":"2026-06-20",
  "total":45.22,
  "tax":3.21,
  "raw_text":"..."
}
```

保存：

```text
IndexedDB.receipts
```

事件：

```text
OCR_COMPLETED
```

---

# 六、OpenAI 税务分类

OpenAI 不负责 OCR。

OpenAI 负责：

```text
IRS 理解
↓
抵税判断
↓
Schedule C 分类
```

---

## Prompt

```text
You are a US tax assistant specialized in 1099 contractors.

Given the receipt information below:

Merchant:
Date:
Total:
Tax:
OCR Text:

Determine:

1. IRS Schedule C category
2. Whether it is deductible
3. Estimated deductible amount
4. Business use confidence (0-1)
5. Any ambiguity requiring user confirmation

Return strict JSON only.
```

---

## 输入示例

```json
{
  "merchant":"Shell",
  "date":"2026-06-20",
  "total":72.14,
  "tax":5.18,
  "ocr_text":"SHELL GASOLINE..."
}
```

---

## 输出示例

```json
{
  "schedule_c_category":"Vehicle Expense",
  "deductible":true,
  "deductible_amount":72.14,
  "business_use_confidence":0.93,
  "requires_confirmation":false
}
```

耗时：

```text
300~700ms
```

---

# 七、IRS 分类规则

常见映射：

| Merchant | IRS Category |
|----------|---------------|
| Shell | Vehicle Expense |
| Chevron | Vehicle Expense |
| Home Depot | Supplies |
| Lowe's | Supplies |
| Walmart Tools | Supplies |
| McDonald's | Meals |
| Starbucks | Meals |
| Office Depot | Office Expense |

---

# 八、抵税计算

计算逻辑：

```text
Deductible Amount
× Business Use Ratio
× Estimated Tax Rate
```

例如：

Gas：

```json
{
  "amount":72.14,
  "business_ratio":1.0,
  "tax_rate":0.25
}
```

结果：

```text
Potential Tax Savings
=
72.14 × 25%
=
18.04 USD
```

---

# 九、用户返回结果

UI：

```text
You can likely save:

$18.04

Category:
Vehicle Expense

Confidence:
93%

Added to Q2 taxes
```

耗时：

```text
0.8~1.5s
```

---

# 十、IndexedDB 存储

Receipt：

```json
{
  "receipt_id":"r001",
  "merchant":"Shell",
  "total":72.14,
  "schedule_c_category":"Vehicle Expense",
  "deductible_amount":72.14,
  "status":"DONE"
}
```

---

# Event：

```text
RECEIPT_CREATED
OCR_COMPLETED
TAX_CALCULATED
SYNC_PENDING
```

---

# 十一、后台同步

用户拍照永不阻塞。

条件：

```typescript
navigator.onLine
&& isCapturing === false
```

同步：

```text
events
↓
batch(50)
↓
POST /sync/events
↓
Event Store
↓
mark synced
```

---

# 十二、Event Store（服务端）

Postgres：

```sql
receipt_events
snapshots
sync_cursor
```

原则：

```text
Append Only
```

禁止：

```text
覆盖更新
```

支持：

```text
1.5 年审计追踪
```

---

# 十三、状态机

```text
RAW
│
▼
OCR_PROCESSING
│
├─────► OCR_FAILED
│            │
│            ▼
│     VISION_FALLBACK
│            │
│            ▼
│       OCR_DONE
│
▼
OCR_DONE
│
▼
TAX_PROCESSING
│
▼
DONE
│
▼
SYNCED
```

---

# 十四、性能目标

| 模块 | 耗时 |
|-------|------|
| IndexedDB Save | <100ms |
| Image Preprocess | 50~100ms |
| Local OCR | 300~800ms |
| OpenAI Tax | 300~700ms |
| Total | 0.8~1.5s |
| Sync | 后台无感知 |

---

# 十五、OpenAI 成本控制

目标：

```text
90%
Local OCR + GPT-mini

5%
GPT-mini 深度分类

1~5%
Vision Fallback
```

平均成本：

```text
< $0.01 / receipt
```

远低于：

```text
所有图片直接走 Vision
```

---

# 十六、安全与合规

图片：

```text
默认仅本地保存
```

上传：

```text
仅用户授权同步
```

同步：

```text
TLS
JWT
Idempotent API
```

服务端：

```text
Append-only Event Store
```

支持：

```text
IRS 审计追溯
```

---

# 十七、最终方案总结

SnapTax 的最佳实践不是：

❌ 将所有图片上传给 OpenAI。

而是：

```text
PWA 拍照
↓
IndexedDB 本地保存
↓
Local OCR（主路径）
↓
Vision（失败兜底）
↓
OpenAI 税务理解
↓
IRS Schedule C 自动分类
↓
抵税金额计算
↓
Event Sourcing 同步
↓
1.5 年离线一致性保障
```

最终用户体验：

"工地上拍一张小票，1 秒左右知道能省多少税，即使没网也不会丢失任何数据。"