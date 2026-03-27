-- Fix P0-1: missing index for getArtistIdsForUser(userId)
-- The UNIQUE(artist_id, user_id) index cannot serve WHERE user_id = ? queries efficiently
CREATE INDEX "artist_memberships_user_id_idx" ON "artist_memberships"("user_id");

-- Fix P0-2: audit_logs.actor_id should be nullable (ON DELETE SET NULL)
-- so that deleting a user does not cascade-block due to RESTRICT FK
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actor_id_fkey";
ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
