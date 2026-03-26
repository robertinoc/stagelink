-- =============================================================
-- Migration: add_user_profile_fields
-- Añade campos de perfil al modelo User para sincronizar
-- con el perfil de WorkOS en el primer login.
--
-- Los campos son nullable porque el user se crea la primera
-- vez que llega un JWT válido — antes de que consultemos
-- el perfil completo a WorkOS.
-- =============================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name"  TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name"   TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url"  TEXT;
