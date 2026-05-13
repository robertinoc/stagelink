-- CreateEnum
CREATE TYPE "dsar_request_type" AS ENUM (
  'access',
  'rectification',
  'erasure',
  'portability',
  'withdraw_consent',
  'objection'
);

-- CreateEnum
CREATE TYPE "dsar_request_status" AS ENUM (
  'received',
  'verified',
  'completed',
  'rejected',
  'failed'
);

-- CreateTable
CREATE TABLE "dsar_requests" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "request_type" "dsar_request_type" NOT NULL,
  "status" "dsar_request_status" NOT NULL DEFAULT 'received',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "dsar_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dsar_requests_user_id_request_type_created_at_idx"
  ON "dsar_requests"("user_id", "request_type", "created_at");

-- CreateIndex
CREATE INDEX "dsar_requests_status_created_at_idx"
  ON "dsar_requests"("status", "created_at");

-- AddForeignKey
ALTER TABLE "dsar_requests"
  ADD CONSTRAINT "dsar_requests_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
