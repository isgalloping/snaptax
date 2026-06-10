-- Snap1099 — PostgreSQL init tables
-- Spec: docs/superpowers/specs/2026-06-05-db-product-alignment-design.md
-- Usage: psql "$DATABASE_URL" -f db/init-table.sql
-- Rollback: psql "$DATABASE_URL" -f db/init-table-down.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- snaptax_users
-- ---------------------------------------------------------------------------

CREATE TABLE snaptax_users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               VARCHAR(255) NOT NULL,
  user_name             VARCHAR(255),
  user_email            VARCHAR(255) NOT NULL,
  industry              VARCHAR(128),
  auth_channel          VARCHAR(128) NOT NULL,
  data_region           VARCHAR(32) NOT NULL DEFAULT 'us',
  data_region_locked_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at            TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT snaptax_users_auth_channel_user_id_key UNIQUE (auth_channel, user_id)
);

CREATE INDEX snaptax_users_user_email_idx ON snaptax_users (user_email);

-- ---------------------------------------------------------------------------
-- snaptax_ghost_account
-- ---------------------------------------------------------------------------

CREATE TABLE snaptax_ghost_account (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghost_id   VARCHAR(255) NOT NULL,
  user_id    UUID NOT NULL,
  bound_at   TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT snaptax_ghost_account_ghost_id_key UNIQUE (ghost_id),
  CONSTRAINT snaptax_ghost_account_user_id_key UNIQUE (user_id),
  CONSTRAINT snaptax_ghost_account_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES snaptax_users (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- snaptax_receipts
-- ---------------------------------------------------------------------------

CREATE TABLE snaptax_receipts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,
  ghost_id      VARCHAR(255),
  image_url     VARCHAR(2048) NOT NULL,
  status        VARCHAR(32) NOT NULL DEFAULT 'processing',
  amount        NUMERIC(10, 2),
  currency      VARCHAR(32),
  merchant_name VARCHAR(255),
  category      VARCHAR(128),
  deductible    BOOLEAN NOT NULL DEFAULT TRUE,
  tax_amount    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  data_region   VARCHAR(8) NOT NULL DEFAULT 'us',
  ai_raw        JSONB,
  captured_at   TIMESTAMPTZ(3) NOT NULL,
  snap_at       TIMESTAMPTZ(3),
  processed_at  TIMESTAMPTZ(3),
  tax_season    VARCHAR(255),
  tax_season_date TIMESTAMPTZ(3),
  created_at    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT snaptax_receipts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES snaptax_users (id) ON DELETE CASCADE
);

CREATE INDEX snaptax_receipts_user_captured_idx
  ON snaptax_receipts (user_id, captured_at DESC);

CREATE INDEX snaptax_receipts_ghost_captured_idx
  ON snaptax_receipts (ghost_id, captured_at DESC);

CREATE INDEX snaptax_receipts_user_snap_idx
  ON snaptax_receipts (user_id, snap_at DESC);

CREATE INDEX snaptax_receipts_processing_idx
  ON snaptax_receipts (status)
  WHERE status = 'processing';

CREATE INDEX snaptax_receipts_user_unfiled_updated_idx
  ON snaptax_receipts (user_id, updated_at DESC)
  WHERE (tax_season IS NULL OR tax_season = '' OR tax_season_date IS NULL);

CREATE INDEX snaptax_receipts_ghost_unfiled_updated_idx
  ON snaptax_receipts (ghost_id, updated_at DESC)
  WHERE (tax_season IS NULL OR tax_season = '' OR tax_season_date IS NULL)
    AND ghost_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- snaptax_season_entitlements
-- ---------------------------------------------------------------------------

CREATE TABLE snaptax_season_entitlements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  tax_season     VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(128) NOT NULL,
  paid_at        TIMESTAMPTZ(3) NOT NULL,
  amount         NUMERIC(10, 2) NOT NULL,
  channel_code   VARCHAR(64) NOT NULL,
  created_at     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT snaptax_season_entitlements_user_season_key
    UNIQUE (user_id, tax_season),
  CONSTRAINT snaptax_season_entitlements_transaction_id_key
    UNIQUE (transaction_id),
  CONSTRAINT snaptax_season_entitlements_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES snaptax_users (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Comments: tables
-- ---------------------------------------------------------------------------

COMMENT ON TABLE snaptax_users IS 'OAuth 登录用户（多通道预留，MVP 仅 google）';
COMMENT ON TABLE snaptax_ghost_account IS 'Ghost 与正式用户的一对一绑定；仅 Google 登录成功时 INSERT，非 Ghost 注册表';
COMMENT ON TABLE snaptax_receipts IS '小票元数据（image_url 存 Vercel Blob pathname）';
COMMENT ON TABLE snaptax_season_entitlements IS '报税季付费权益（每用户每季一条）';

-- ---------------------------------------------------------------------------
-- Comments: snaptax_users columns
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN snaptax_users.id IS '内部主键 UUID，子表外键锚点';
COMMENT ON COLUMN snaptax_users.user_id IS 'OAuth 提供方用户 ID（如 Google sub）';
COMMENT ON COLUMN snaptax_users.user_name IS '显示名；无邮箱时可用（如 Facebook 用户）';
COMMENT ON COLUMN snaptax_users.user_email IS '用户邮箱';
COMMENT ON COLUMN snaptax_users.industry IS '用户行业；应用层枚举：truck_driver, plumber, electrician, construction, delivery, general';
COMMENT ON COLUMN snaptax_users.auth_channel IS '登录渠道；应用层枚举：google, github, facebook, twitter';
COMMENT ON COLUMN snaptax_users.data_region IS '数据驻留区域；应用层枚举：eu, us；MVP 固定 us';
COMMENT ON COLUMN snaptax_users.data_region_locked_at IS 'data_region 确认时间；Google 登录时写入，MVP 不可改；TIMESTAMPTZ UTC';
COMMENT ON COLUMN snaptax_users.created_at IS '账户创建时间（TIMESTAMPTZ UTC）';
COMMENT ON COLUMN snaptax_users.updated_at IS '账户最后更新时间（TIMESTAMPTZ UTC）';

-- ---------------------------------------------------------------------------
-- Comments: snaptax_ghost_account columns
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN snaptax_ghost_account.id IS '绑定记录主键 UUID';
COMMENT ON COLUMN snaptax_ghost_account.ghost_id IS '浏览器 Ghost ID（HMAC token 内 id）；POST /api/ghost/register 不写本表';
COMMENT ON COLUMN snaptax_ghost_account.user_id IS '绑定的 snaptax_users.id';
COMMENT ON COLUMN snaptax_ghost_account.bound_at IS 'Ghost 与正式账户绑定时间（TIMESTAMPTZ UTC）';
COMMENT ON COLUMN snaptax_ghost_account.created_at IS '记录创建时间（TIMESTAMPTZ UTC）';
COMMENT ON COLUMN snaptax_ghost_account.updated_at IS '记录最后更新时间（TIMESTAMPTZ UTC）';

-- ---------------------------------------------------------------------------
-- Comments: snaptax_receipts columns
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN snaptax_receipts.id IS '小票主键 UUID';
COMMENT ON COLUMN snaptax_receipts.user_id IS '所属用户 snaptax_users.id；未登录时为 NULL';
COMMENT ON COLUMN snaptax_receipts.ghost_id IS '未登录 Ghost ID；绑定后 user_id 写入，ghost_id 可保留审计；与 user_id 至少一个有值（应用层）';
COMMENT ON COLUMN snaptax_receipts.image_url IS 'Vercel Blob pathname（私有对象键，如 receipts/{uuid}.jpg）；非 signed URL、非 public URL；读时 getDownloadUrl 生成短期链接';
COMMENT ON COLUMN snaptax_receipts.status IS '处理状态；应用层枚举：processing, done, blurry';
COMMENT ON COLUMN snaptax_receipts.amount IS '小票金额';
COMMENT ON COLUMN snaptax_receipts.currency IS '币种（如 USD）';
COMMENT ON COLUMN snaptax_receipts.merchant_name IS '商户名称，AI 识别结果';
COMMENT ON COLUMN snaptax_receipts.category IS '费用类别；应用层枚举：TRUCK GAS, TOOLS, SUPPLIES, EQUIPMENT, MATERIALS, PERSONAL, OTHER';
COMMENT ON COLUMN snaptax_receipts.deductible IS '是否可抵扣，默认 true';
COMMENT ON COLUMN snaptax_receipts.tax_amount IS '估算省税（US/EU 语义不同）；仅 OpenAI Vision 路径写入';
COMMENT ON COLUMN snaptax_receipts.data_region IS '税法辖区快照 us|eu；与物理驻留解耦';
COMMENT ON COLUMN snaptax_receipts.ai_raw IS 'OpenAI Vision 原始 JSON 响应';
COMMENT ON COLUMN snaptax_receipts.captured_at IS '上传/入库时间（TIMESTAMPTZ UTC）';
COMMENT ON COLUMN snaptax_receipts.snap_at IS '拍照时间，可与 captured_at 不同（离线延迟上传）；TIMESTAMPTZ UTC';
COMMENT ON COLUMN snaptax_receipts.processed_at IS 'AI 处理完成时间；status=processing 时为 NULL；TIMESTAMPTZ UTC';
COMMENT ON COLUMN snaptax_receipts.tax_season IS '已报税季标识（如 2026）；与 tax_season_date 同时有值表示已报税';
COMMENT ON COLUMN snaptax_receipts.tax_season_date IS '标记已报税时间（TIMESTAMPTZ UTC）；与 tax_season 同时有值表示已报税';
COMMENT ON COLUMN snaptax_receipts.created_at IS '服务端记录创建时间（TIMESTAMPTZ UTC）';
COMMENT ON COLUMN snaptax_receipts.updated_at IS '服务端记录最后更新时间（TIMESTAMPTZ UTC）';

-- ---------------------------------------------------------------------------
-- Comments: snaptax_season_entitlements columns
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN snaptax_season_entitlements.id IS '权益记录主键 UUID';
COMMENT ON COLUMN snaptax_season_entitlements.user_id IS '付费用户 snaptax_users.id';
COMMENT ON COLUMN snaptax_season_entitlements.tax_season IS '报税季标识，如 2026';
COMMENT ON COLUMN snaptax_season_entitlements.transaction_id IS '支付交易号（Paddle 等），Webhook 幂等键';
COMMENT ON COLUMN snaptax_season_entitlements.paid_at IS '支付成功时间（TIMESTAMPTZ UTC）';
COMMENT ON COLUMN snaptax_season_entitlements.amount IS '实付金额';
COMMENT ON COLUMN snaptax_season_entitlements.channel_code IS '支付渠道；MVP 应用层枚举：paddle';
COMMENT ON COLUMN snaptax_season_entitlements.created_at IS '记录创建时间（TIMESTAMPTZ UTC）';
COMMENT ON COLUMN snaptax_season_entitlements.updated_at IS '记录最后更新时间（TIMESTAMPTZ UTC）';

-- ---------------------------------------------------------------------------
-- Comments: indexes
-- ---------------------------------------------------------------------------

COMMENT ON INDEX snaptax_users_auth_channel_user_id_key IS '登录 upsert：(auth_channel, user_id) 唯一';
COMMENT ON INDEX snaptax_users_user_email_idx IS '按邮箱查用户';
COMMENT ON INDEX snaptax_ghost_account_ghost_id_key IS 'Ghost 绑定查 ghost_id';
COMMENT ON INDEX snaptax_ghost_account_user_id_key IS '查用户对应的 Ghost 绑定';
COMMENT ON INDEX snaptax_receipts_user_captured_idx IS '主界面最近小票：user_id + captured_at DESC';
COMMENT ON INDEX snaptax_receipts_ghost_captured_idx IS '未登录 Ghost 维度小票列表与未绑定计数';
COMMENT ON INDEX snaptax_receipts_user_snap_idx IS '按拍照时间排序的小票列表';
COMMENT ON INDEX snaptax_receipts_processing_idx IS 'AI 处理中队列（部分索引，仅 status=processing）';
COMMENT ON INDEX snaptax_season_entitlements_user_season_key IS 'Export 权益检查：每用户每报税季一条';
COMMENT ON INDEX snaptax_season_entitlements_transaction_id_key IS 'Paddle Webhook 幂等：transaction_id 唯一';

COMMIT;
