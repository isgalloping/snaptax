-- CreateTable
CREATE TABLE "snaptax_rate_limit_buckets" (
    "bucket_key" VARCHAR(255) NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "snaptax_rate_limit_buckets_pkey" PRIMARY KEY ("bucket_key")
);

-- CreateIndex
CREATE INDEX "snaptax_rate_limit_buckets_window_start_idx" ON "snaptax_rate_limit_buckets"("window_start");
