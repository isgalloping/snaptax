-- AlterTable
ALTER TABLE "snaptax_receipts" ADD COLUMN "ai_confidence" DOUBLE PRECISION;

COMMENT ON COLUMN snaptax_receipts.ai_confidence IS 'OpenAI Vision confidence 0–1; REVIEW bucket at 0.5–0.69';
