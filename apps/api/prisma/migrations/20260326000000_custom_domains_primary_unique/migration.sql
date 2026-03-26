-- =============================================================
-- Migration: custom_domains_primary_unique
-- Garantiza que un artista tenga como máximo un dominio primario.
--
-- Prisma no soporta partial unique indexes en el schema DSL,
-- por eso se crea manualmente aquí.
--
-- Un partial unique index solo aplica a las filas donde
-- is_primary = true, permitiendo múltiples filas con is_primary = false
-- para el mismo artist_id (varios dominios no-primarios por artista).
-- =============================================================

CREATE UNIQUE INDEX "custom_domains_artist_primary_unique"
ON "custom_domains"("artist_id")
WHERE "is_primary" = true;
