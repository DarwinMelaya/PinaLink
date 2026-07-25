-- Per-issuer verification page branding (logo, title, accent)
CREATE TABLE IF NOT EXISTS "certificate_branding" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "logo_data_url" TEXT,
  "page_title" VARCHAR(120),
  "page_subtitle" VARCHAR(240),
  "accent_color" VARCHAR(7),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "certificate_branding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "certificate_branding_user_id_key"
  ON "certificate_branding"("user_id");

ALTER TABLE "certificate_branding"
  ADD CONSTRAINT "certificate_branding_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certificate_branding" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificate_branding_select_public"
  ON "certificate_branding" FOR SELECT
  USING (true);

CREATE POLICY "certificate_branding_insert_public"
  ON "certificate_branding" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "certificate_branding_update_public"
  ON "certificate_branding" FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "certificate_branding_delete_public"
  ON "certificate_branding" FOR DELETE
  USING (true);
