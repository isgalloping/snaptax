# 12 — 本地图片存储与压缩（客户端）

> **Canonical** — 改拍照持久化、OPFS、缩略图、90 天原图回收前必读。  
> 关联：[`DB-DESIGN-SPEC.md`](./DB-DESIGN-SPEC.md) §2.2 · [`2026-06-12-local-data-encryption-design.md`](../superpowers/specs/2026-06-12-local-data-encryption-design.md) · [`11-ocr-pipeline-design.md`](./11-ocr-pipeline-design.md)

**状态：** Implemented（2026-06-19） · **计划：** [`2026-06-19-local-image-storage-opfs.md`](../superpowers/plans/2026-06-19-local-image-storage-opfs.md)

---

## 1. 目标

1. **IndexedDB 只存图片元数据**；像素字节进 **OPFS**（Origin Private File System），不占用 IDB 配额。
2. **拍照后立即压缩**，典型机拍 4032×3024（3～5MB）→ **1280×960 内 fit、JPEG 75%、约 200～300KB**。
3. **已同步且超过 90 天**：删除本地**原图** OPFS 文件，**仅保留缩略图**；看图走服务端 signed URL（与 server-primary 一致）。

---

## 2. 分层架构

```text
capture / gallery pick
  → compressReceiptImage (1280×960, q75)
  → generateThumbnail (480 long edge, q70)
  → encrypt → OPFS write (full + thumb)
  → IDB snaptax_receipt_photos (metadata row only)
```

| 层 | 职责 |
|----|------|
| **`snaptax_receipt_photos`（IDB）** | 元数据：路径、尺寸、字节数、同步/回收状态；**禁止**存 `Blob` / `ArrayBuffer`  ciphertext |
| **OPFS** | 加密后的 full / thumb 文件（AES-GCM，与 LEL 共用 DEK） |
| **Vercel Blob** | 上传后的权威原图（pathname 在 `snaptax_receipts.image_url`） |
| **Signed URL** | 本地无 full 时详情/放大查看 |

---

## 3. 拍照压缩（Capture Pipeline）

### 3.1 参数（锁定）

| 项 | 值 | 说明 |
|----|-----|------|
| 输入典型 | 4032×3024，3～5MB JPEG | 手机主摄 / 相册 |
| 输出尺寸 | **长边 ≤1280**，短边按比例（4:3 约 **1280×960**） | `fit: inside`，不放大 |
| 格式 | **JPEG** | 统一 MIME |
| 质量 | **0.75（75%）** | `canvas.toBlob` 或 OffscreenCanvas / WASM |
| 目标体积 | **200～300KB** | 超出时二次降质（最低 0.65）或略缩边长 |

### 3.2 模块（目标）

```
lib/camera/compressReceiptImage.ts   # 主压缩
lib/camera/generateReceiptThumbnail.ts
lib/storage/opfs/photoFiles.ts       # OPFS 读写 + 路径约定
lib/storage/photoMetadata.ts         # IDB 元数据 CRUD
```

### 3.3 与现网差异

| 现网 | 目标 |
|------|------|
| `captureVideoFrame` 全分辨率 + q0.92 | 压缩后再 persist |
| 密文 Blob 在 IDB `photos` store | 密文在 OPFS，IDB 仅 meta |
| 上传成功 **立即**删本地图 | 上传成功保留 full **最多 90 天**，再回收 |

**服务端 Vision 预处理**（`prepareVisionImage` 1568/q82）**不变** — 客户端压缩仅影响本地存储与上传 payload 体积。

---

## 4. IndexedDB 元数据（`snaptax_receipt_photos`）

```typescript
/** 仅存元数据 — 像素在 OPFS */
export type ReceiptPhotoMeta = {
  id: string;                    // = receipt.id
  v: 2;
  mime: "image/jpeg";
  width: number;                 // 压缩后 full 宽
  height: number;                // 压缩后 full 高
  byteLength: number;            // 压缩后 full 明文大小（加密前）
  thumbWidth: number;
  thumbHeight: number;
  thumbByteLength: number;
  opfsFullPath: string;          // 例 snaptax/photos/{id}/full.v1.enc
  opfsThumbPath: string;         // 例 snaptax/photos/{id}/thumb.v1.enc
  cipher: { alg: "AES-GCM"; v: 1 };
  /** 上传成功且 server 有图时写入 */
  remoteSyncedAtMs?: number;
  /** 90 天回收后：删 full 文件，置 true */
  fullPurged?: boolean;
  fullPurgedAtMs?: number;
};
```

**索引（可选）：** `remoteSyncedAtMs` — 供 idle 回收任务 cursor。

---

## 5. OPFS 布局

根目录：`snaptax/`（与 DB/store 命名空间一致）

```text
snaptax/photos/{receiptId}/full.v1.enc    # AES-GCM 密文
snaptax/photos/{receiptId}/thumb.v1.enc
```

- 读写 API：`navigator.storage.getDirectory()` → `photos/{id}/`
- 加密：与 [`local-data-encryption-design`](../superpowers/specs/2026-06-12-local-data-encryption-design.md) 相同 DEK；文件头含 `iv`（或 sidecar 写入 meta 仅索引 iv 偏移 — 实现时二选一，meta 已够用则 iv 存 IDB 行可选字段 `fullIv` / `thumbIv`）

**OPFS 不可用（极少数环境）：** 降级为「IDB 仅存 meta + 提示用户换浏览器」；**禁止**回退明文 IDB 大图（违背 LEL）。MVP 可暂保留 legacy 加密 IDB 路径至迁移完成。

---

## 6. 缩略图

| 项 | 值 |
|----|-----|
| 长边 | **480px**（fit inside） |
| 格式 / 质量 | JPEG **70%** |
| 目标体积 | 约 40～80KB |
| 用途 | 列表卡片、连拍预览、Resnap 小窗；**非** IRS 审计级 |

在 **同一次 capture** 中由 full 压缩结果派生，避免二次读相机原图。

---

## 7. 生命周期与 90 天回收

```text
pendingUpload / 未同步
  → 保留 OPFS full + thumb（压缩后体积已控）

上传成功 (hasRemoteImage=true)
  → 写 remoteSyncedAtMs
  → 仍保留 full + thumb（便于离线回看、导出）

remoteSyncedAtMs + 90 天 且 idle 任务
  → 删除 opfsFullPath 文件
  → fullPurged=true；保留 thumb

用户打开详情 / 放大
  → 有 full：本地解密
  → 无 full、有 remote：GET /api/receipts/:id/image
  → 仅有 thumb：列表/预览用 thumb；放大走 signed URL
```

| 条件 | 本地 full | 本地 thumb | 远程 |
|------|-----------|------------|------|
| 未同步 | ✓ | ✓ | — |
| 已同步 &lt; 90d | ✓ | ✓ | ✓ |
| 已同步 ≥ 90d | ✗ | ✓ | ✓ |
| 18 月小票 prune（见 sync spec） | 删 receipt + 全部 OPFS 目录 | — | — |

**永不回收 full：** `pendingUpload=true` 或 `status=processing`（即使已超过 90 天）。

**触发：** `requestIdleCallback` / 启动后 ≥30s，与 [`receiptRetention`](../superpowers/specs/2026-06-19-receipt-lifecycle-sync-redesign-design.md) idle 任务合并；**不阻塞**首屏与快门。

---

## 8. 与 OCR Phase 1

- Worker OCR 输入：**压缩后的 full**（1280×960），体积与清晰度足够 Tesseract / 规则解析。
- Path B Vision 兜底：上传压缩图；服务端仍可按需 `prepareVisionImage`（1568/q82）。

---

## 9. 迁移（v4/v5 → 目标）

1. IDB v5：`snaptax_receipt_photos` 仅 meta schema v2。
2. 迁移 job：旧 IDB 密文 Blob → 解密 → 写 OPFS → 写 meta 行 → 删旧 Blob。
3. 新拍：直接走 compress → OPFS。

---

## 10. 验收

1. DevTools → IDB `snaptax_receipt_photos`：行内无 `ct`/`blob`；有 `opfsFullPath`。
2. Application → OPFS：可见 `snaptax/photos/{id}/` 密文文件。
3. 模拟 4032×3024 输入：persist 后 full **200～300KB** 量级（JPEG 75%）。
4. 上传成功 + 将 `remoteSyncedAtMs` 设为 91 天前 → idle 回收后 full 文件消失，thumb 仍在。
5. 详情页无 full 时：Network 出现 signed URL，图片可显示。

---

## 11. 文档与代码映射（实现时）

| 文档 | 变更 |
|------|------|
| `DB-DESIGN-SPEC.md` §2.2 | `snaptax_receipt_photos` = meta only |
| `04-data-model.md` §4.7 | 元数据字段表 |
| `local-data-encryption-design.md` | §5.3 标记 superseded by 本文 |
| `receipt-lifecycle-sync-redesign-design.md` §4 | 增加 90d 图回收 |
| `capturePhoto.ts` | 调用 compress |
| `photoStore.ts` | 拆 meta + OPFS |
