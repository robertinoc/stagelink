ALTER TABLE "artists"
ADD COLUMN "base_locale" TEXT NOT NULL DEFAULT 'en';

ALTER TABLE "epks"
ADD COLUMN "base_locale" TEXT NOT NULL DEFAULT 'en';
