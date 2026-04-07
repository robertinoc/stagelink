-- CreateTable
CREATE TABLE "epks" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "headline" TEXT,
    "short_bio" TEXT,
    "full_bio" TEXT,
    "press_quote" TEXT,
    "booking_email" TEXT,
    "management_contact" TEXT,
    "press_contact" TEXT,
    "hero_image_url" TEXT,
    "gallery_image_urls" JSONB NOT NULL DEFAULT '[]',
    "featured_media" JSONB NOT NULL DEFAULT '[]',
    "featured_links" JSONB NOT NULL DEFAULT '[]',
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "rider_info" TEXT,
    "tech_requirements" TEXT,
    "location" TEXT,
    "availability_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epks_pkey" PRIMARY KEY ("id")
);

-- AlterEnum
ALTER TYPE "asset_kind" ADD VALUE 'epk_image';

-- CreateIndex
CREATE UNIQUE INDEX "epks_artist_id_key" ON "epks"("artist_id");

-- AddForeignKey
ALTER TABLE "epks" ADD CONSTRAINT "epks_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
