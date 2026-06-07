-- CreateTable
CREATE TABLE "snaptax_users" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "user_name" VARCHAR(255),
    "user_email" VARCHAR(255) NOT NULL,
    "industry" VARCHAR(128),
    "auth_channel" VARCHAR(128) NOT NULL,
    "data_region" VARCHAR(8) NOT NULL DEFAULT 'us',
    "data_region_locked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "snaptax_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snaptax_ghost_account" (
    "id" UUID NOT NULL,
    "ghost_id" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "bound_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "snaptax_ghost_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snaptax_receipts" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "ghost_id" VARCHAR(255),
    "image_url" VARCHAR(2048) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'processing',
    "amount" DECIMAL(10,2),
    "currency" VARCHAR(32),
    "merchant_name" VARCHAR(255),
    "category" VARCHAR(128),
    "deductible" BOOLEAN NOT NULL DEFAULT true,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "data_region" VARCHAR(8) NOT NULL DEFAULT 'us',
    "ai_raw" JSONB,
    "captured_at" TIMESTAMPTZ(3) NOT NULL,
    "snap_at" TIMESTAMPTZ(3),
    "processed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "snaptax_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snaptax_season_entitlements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tax_season" VARCHAR(255) NOT NULL,
    "transaction_id" VARCHAR(128) NOT NULL,
    "paid_at" TIMESTAMPTZ(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "channel_code" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "snaptax_season_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "snaptax_users_user_email_idx" ON "snaptax_users"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "snaptax_users_auth_channel_user_id_key" ON "snaptax_users"("auth_channel", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "snaptax_ghost_account_ghost_id_key" ON "snaptax_ghost_account"("ghost_id");

-- CreateIndex
CREATE UNIQUE INDEX "snaptax_ghost_account_user_id_key" ON "snaptax_ghost_account"("user_id");

-- CreateIndex
CREATE INDEX "snaptax_receipts_user_captured_idx" ON "snaptax_receipts"("user_id", "captured_at" DESC);

-- CreateIndex
CREATE INDEX "snaptax_receipts_ghost_captured_idx" ON "snaptax_receipts"("ghost_id", "captured_at" DESC);

-- CreateIndex
CREATE INDEX "snaptax_receipts_user_snap_idx" ON "snaptax_receipts"("user_id", "snap_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "snaptax_season_entitlements_transaction_id_key" ON "snaptax_season_entitlements"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "snaptax_season_entitlements_user_season_key" ON "snaptax_season_entitlements"("user_id", "tax_season");

-- AddForeignKey
ALTER TABLE "snaptax_ghost_account" ADD CONSTRAINT "snaptax_ghost_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snaptax_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snaptax_receipts" ADD CONSTRAINT "snaptax_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snaptax_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snaptax_season_entitlements" ADD CONSTRAINT "snaptax_season_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "snaptax_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
