-- AlterTable: add optional theme JSONB column to pages
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "theme" JSONB;
