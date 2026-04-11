-- T6-5 — Multi-language pages and translation infrastructure

ALTER TABLE "artists"
ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "epks"
ADD COLUMN "translations" JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "blocks"
ADD COLUMN "localized_content" JSONB NOT NULL DEFAULT '{}'::jsonb;
