-- Partial unique index: one user per founder seat number (1–50)

CREATE UNIQUE INDEX "snaptax_users_founder_number_uidx"
  ON "snaptax_users"("founder_number")
  WHERE "founder_number" IS NOT NULL;

COMMENT ON INDEX snaptax_users_founder_number_uidx IS 'Founder seat numbers are unique; prevents #50 race duplicates';
