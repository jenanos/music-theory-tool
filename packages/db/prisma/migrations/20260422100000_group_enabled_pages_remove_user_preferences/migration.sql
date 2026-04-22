-- AlterTable
ALTER TABLE "groups" ADD COLUMN "enabled_pages" TEXT[] DEFAULT ARRAY['charts', 'progressions']::TEXT[];

-- Backfill existing groups so members keep the old default set of pages
UPDATE "groups" SET "enabled_pages" = ARRAY['charts', 'progressions']::TEXT[] WHERE "enabled_pages" IS NULL;

-- DropForeignKey
ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_user_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "user_preferences";
