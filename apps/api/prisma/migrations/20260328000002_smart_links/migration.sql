-- CreateTable: smart_links
-- SmartLink model: platform-aware redirect links with JSON destinations array.

CREATE TABLE "smart_links" (
    "id"           TEXT        NOT NULL,
    "artist_id"    TEXT        NOT NULL,
    "label"        TEXT        NOT NULL,
    "destinations" JSONB       NOT NULL DEFAULT '[]',
    "is_active"    BOOLEAN     NOT NULL DEFAULT true,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "smart_links_artist_id_idx" ON "smart_links"("artist_id");

-- AddForeignKey
ALTER TABLE "smart_links"
    ADD CONSTRAINT "smart_links_artist_id_fkey"
    FOREIGN KEY ("artist_id")
    REFERENCES "artists"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
