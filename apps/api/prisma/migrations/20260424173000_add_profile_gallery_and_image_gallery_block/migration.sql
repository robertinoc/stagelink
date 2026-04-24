ALTER TYPE "asset_kind" ADD VALUE 'profile_gallery';

ALTER TABLE "artists"
ADD COLUMN "gallery_image_urls" JSONB NOT NULL DEFAULT '[]';

ALTER TYPE "block_type" ADD VALUE 'image_gallery';
