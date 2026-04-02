ALTER TABLE "artists"
ADD COLUMN "secondary_categories" "artist_category"[] NOT NULL DEFAULT ARRAY[]::"artist_category"[];
