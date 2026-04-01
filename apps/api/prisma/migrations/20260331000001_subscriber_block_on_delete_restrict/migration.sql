-- =============================================================
-- T4-3 fix: Change subscribers.block_id FK from CASCADE to RESTRICT
--
-- Motivation:
--   onDelete: Cascade meant that deleting an email_capture block would
--   silently delete all subscribers captured through it — permanent data
--   loss for the artist's email list.
--
--   onDelete: Restrict prevents the block from being deleted while
--   subscribers reference it, making data loss impossible by accident.
--   Artists must explicitly remove subscribers before removing the block.
-- =============================================================

ALTER TABLE "subscribers" DROP CONSTRAINT "subscribers_block_id_fkey";

ALTER TABLE "subscribers"
  ADD CONSTRAINT "subscribers_block_id_fkey"
  FOREIGN KEY ("block_id") REFERENCES "blocks"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
