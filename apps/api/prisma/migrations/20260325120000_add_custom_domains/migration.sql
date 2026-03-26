-- =============================================================
-- Migration: add_custom_domains
-- Agrega el modelo CustomDomain para soporte futuro de dominios
-- personalizados por artista. La resolución por dominio se
-- implementará una vez que este modelo esté en producción.
-- =============================================================

-- Enum para el estado del dominio personalizado
CREATE TYPE "custom_domain_status" AS ENUM (
  'pending',
  'active',
  'failed',
  'disabled'
);

-- Tabla de dominios personalizados
CREATE TABLE "custom_domains" (
  "id"         TEXT NOT NULL,
  "artist_id"  TEXT NOT NULL,
  "domain"     TEXT NOT NULL,       -- Normalizado: lowercase, sin www, sin trailing slash
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "status"     "custom_domain_status" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

-- Unicidad global de dominio (un dominio solo puede pertenecer a un artista)
CREATE UNIQUE INDEX "custom_domains_domain_key" ON "custom_domains"("domain");

-- Índice para buscar todos los dominios de un artista
CREATE INDEX "custom_domains_artist_id_idx" ON "custom_domains"("artist_id");

-- Índice compuesto para resolver dominio activo eficientemente
CREATE INDEX "custom_domains_domain_status_idx" ON "custom_domains"("domain", "status");

-- Foreign key: cascade delete cuando se elimina el artista
ALTER TABLE "custom_domains"
  ADD CONSTRAINT "custom_domains_artist_id_fkey"
  FOREIGN KEY ("artist_id")
  REFERENCES "artists"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
