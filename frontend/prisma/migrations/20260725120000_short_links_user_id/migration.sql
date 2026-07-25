-- AlterTable
ALTER TABLE "short_links" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "short_links_user_id_idx" ON "short_links"("user_id");

-- Optional FK to profiles (nullable for legacy rows)
DO $$ BEGIN
  ALTER TABLE "short_links"
    ADD CONSTRAINT "short_links_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
