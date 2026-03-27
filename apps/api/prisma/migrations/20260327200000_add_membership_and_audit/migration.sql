-- CreateEnum
CREATE TYPE "artist_role" AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- CreateTable artist_memberships
CREATE TABLE "artist_memberships" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "artist_role" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Unique constraint
ALTER TABLE "artist_memberships" ADD CONSTRAINT "artist_memberships_artist_id_user_id_key" UNIQUE ("artist_id", "user_id");

-- Foreign keys
ALTER TABLE "artist_memberships" ADD CONSTRAINT "artist_memberships_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_memberships" ADD CONSTRAINT "artist_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- Backfill: create owner memberships for all existing artists
INSERT INTO "artist_memberships" ("id", "artist_id", "user_id", "role", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  a."id",
  a."user_id",
  'owner',
  NOW(),
  NOW()
FROM "artists" a
ON CONFLICT ("artist_id", "user_id") DO NOTHING;
