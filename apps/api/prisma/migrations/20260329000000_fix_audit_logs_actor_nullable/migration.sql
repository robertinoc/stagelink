-- Fix audit_logs.actor_id:
--   1. Drop the RESTRICT FK (blocks inserts with null/non-user actor_id)
--   2. Make the column nullable (public/unauthenticated actions use NULL)
--   3. Re-add FK with ON DELETE SET NULL so audit rows survive user deletion

ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actor_id_fkey";

ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
