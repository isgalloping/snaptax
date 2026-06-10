-- Add per-receipt tax filing markers + unfiled partial indexes

ALTER TABLE snaptax_receipts
  ADD COLUMN IF NOT EXISTS tax_season VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tax_season_date TIMESTAMPTZ(3);

COMMENT ON COLUMN snaptax_receipts.tax_season IS '已报税季标识（如 2026）；与 tax_season_date 同时有值表示已报税';
COMMENT ON COLUMN snaptax_receipts.tax_season_date IS '标记已报税时间（TIMESTAMPTZ UTC）；与 tax_season 同时有值表示已报税';

CREATE INDEX IF NOT EXISTS snaptax_receipts_user_unfiled_updated_idx
  ON snaptax_receipts (user_id, updated_at DESC)
  WHERE (tax_season IS NULL OR tax_season = '' OR tax_season_date IS NULL);

CREATE INDEX IF NOT EXISTS snaptax_receipts_ghost_unfiled_updated_idx
  ON snaptax_receipts (ghost_id, updated_at DESC)
  WHERE (tax_season IS NULL OR tax_season = '' OR tax_season_date IS NULL)
    AND ghost_id IS NOT NULL;

COMMENT ON INDEX snaptax_receipts_user_unfiled_updated_idx IS '未报税小票最近更新列表（user_id + updated_at DESC）';
COMMENT ON INDEX snaptax_receipts_ghost_unfiled_updated_idx IS 'Ghost 未报税小票最近更新列表';
