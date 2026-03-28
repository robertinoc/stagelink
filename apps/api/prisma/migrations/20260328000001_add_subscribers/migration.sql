-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_block_id_email_key" ON "subscribers"("block_id", "email");

-- AddForeignKey
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_block_id_fkey"
    FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
