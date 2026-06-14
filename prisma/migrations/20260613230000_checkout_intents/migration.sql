-- CreateTable
CREATE TABLE "snaptax_checkout_intents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tax_season" VARCHAR(255) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "transaction_id" VARCHAR(128),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "snaptax_checkout_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snaptax_checkout_intents_transaction_id_key" ON "snaptax_checkout_intents"("transaction_id");

-- CreateIndex
CREATE INDEX "snaptax_checkout_intents_user_season_idx" ON "snaptax_checkout_intents"("user_id", "tax_season");

-- AddForeignKey
ALTER TABLE "snaptax_checkout_intents" ADD CONSTRAINT "snaptax_checkout_intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snaptax_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
