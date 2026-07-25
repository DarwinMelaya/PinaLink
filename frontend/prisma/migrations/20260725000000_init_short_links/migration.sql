-- CreateTable
CREATE TABLE IF NOT EXISTS "short_links" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "original_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "click_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "short_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "short_links_code_key" ON "short_links"("code");

-- Anon key needs these for SPA insert/select/update
ALTER TABLE "short_links" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "short_links_select_public"
  ON "short_links" FOR SELECT
  USING (true);

CREATE POLICY "short_links_insert_public"
  ON "short_links" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "short_links_update_public"
  ON "short_links" FOR UPDATE
  USING (true)
  WITH CHECK (true);
