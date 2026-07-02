-- Founder Program tier columns on snaptax_users

ALTER TABLE "snaptax_users"
  ADD COLUMN "founder_number" INTEGER,
  ADD COLUMN "founder_tier" VARCHAR(32),
  ADD COLUMN "founder_status" VARCHAR(16),
  ADD COLUMN "founder_locked_at" TIMESTAMPTZ(3);

CREATE INDEX "snaptax_users_founder_number_idx" ON "snaptax_users"("founder_number");

COMMENT ON COLUMN snaptax_users.founder_number IS 'Founder seat number 1–50; atomically assigned on first qualifying purchase; null if not a Founder';
COMMENT ON COLUMN snaptax_users.founder_tier IS 'Founder SKU tier; app enum: FOUNDER_LEVEL_SUPER, EARLY, FOUNDER, DEFAULT';
COMMENT ON COLUMN snaptax_users.founder_status IS 'Founder subscription status; app enum: active, lapsed; null if never a Founder';
COMMENT ON COLUMN snaptax_users.founder_locked_at IS 'Timestamp when Founder tier was locked on first purchase (TIMESTAMPTZ UTC)';

COMMENT ON INDEX snaptax_users_founder_number_idx IS 'Founder seat lookup and claimedCount queries';
