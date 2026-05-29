-- Sync schema with reality.
--
-- The index `artist_memberships_user_id_idx` was already created by
-- 20260327210000_fix_membership_index_and_audit_fk, but the Prisma schema
-- was missing `@@index([userId])` on `ArtistMembership`. We now add the
-- annotation in schema.prisma so the schema reflects what's in the DB.
--
-- IF NOT EXISTS keeps this migration safe on every environment:
--   - On DBs that already have the index (production, staging): no-op.
--   - On fresh DBs that somehow skipped the earlier migration: creates it.

CREATE INDEX IF NOT EXISTS "artist_memberships_user_id_idx"
  ON "artist_memberships"("user_id");
