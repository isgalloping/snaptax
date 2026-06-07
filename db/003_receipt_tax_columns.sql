-- Add tax columns to snaptax_receipts (for existing DBs initialized before 2026-06-07)
-- Usage: psql "$DATABASE_URL" -f db/003_receipt_tax_columns.sql

ALTER TABLE snaptax_receipts
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_region VARCHAR(8) NOT NULL DEFAULT 'us';

COMMENT ON COLUMN snaptax_receipts.tax_amount IS '估算省税（US/EU 语义不同）；仅 OpenAI Vision 路径写入';
COMMENT ON COLUMN snaptax_receipts.data_region IS '税法辖区快照 us|eu；与物理驻留解耦';
