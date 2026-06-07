-- CreateIndex
CREATE INDEX "snaptax_receipts_user_updated_idx" ON "snaptax_receipts"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "snaptax_receipts_ghost_updated_idx" ON "snaptax_receipts"("ghost_id", "updated_at" DESC);
