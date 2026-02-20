CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "key" TEXT,
    "notes" TEXT,
    "arrangement" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "chord_lines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "degree_lines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "original_songs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "key" TEXT,
    "notes" TEXT,
    "arrangement" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "original_songs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "original_sections" (
    "id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "chord_lines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "degree_lines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "original_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_progressions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tonic" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "sequence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_progressions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sections_song_id_order_index_idx" ON "sections"("song_id", "order_index");
CREATE INDEX "original_sections_song_id_order_index_idx" ON "original_sections"("song_id", "order_index");
CREATE INDEX "saved_progressions_created_at_idx" ON "saved_progressions"("created_at");

ALTER TABLE "sections"
ADD CONSTRAINT "sections_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "original_sections"
ADD CONSTRAINT "original_sections_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "original_songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
