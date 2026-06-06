-- DEPRECATED: 已合并至 db/init-table.sql（snaptax_users.data_region / data_region_locked_at）
-- 新环境请仅执行 init-table.sql；已有库若仅缺此二列可继续执行本文件（幂等 ADD IF NOT EXISTS）
-- 注意：若从 TIMESTAMP(3) 升级全库时区，请使用独立 migration，见 docs/superpowers/specs/2026-06-05-db-product-alignment-design.md §11

BEGIN;

ALTER TABLE snaptax_users
  ADD COLUMN IF NOT EXISTS data_region VARCHAR(8) NOT NULL DEFAULT 'us',
  ADD COLUMN IF NOT EXISTS data_region_locked_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN snaptax_users.data_region IS '数据驻留区域；应用层枚举：eu, us';
COMMENT ON COLUMN snaptax_users.data_region_locked_at IS 'data_region 确认时间，MVP 不可改；TIMESTAMPTZ UTC';

COMMIT;
