-- Migration: 20260528120000_epk_template_and_brand
-- Adds template selection and brand customization to EPK.
-- template_id defaults to 'studio' (the free base template).
-- brand is nullable JSON — only set when artist has applied a custom brand.

ALTER TABLE "epks"
  ADD COLUMN IF NOT EXISTS "template_id" TEXT NOT NULL DEFAULT 'studio',
  ADD COLUMN IF NOT EXISTS "brand"        JSONB;
