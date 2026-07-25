-- Customize short links: metadata + QR style + vanity codes + delete RLS
ALTER TABLE "short_links" ALTER COLUMN "code" TYPE VARCHAR(24);

ALTER TABLE "short_links" ADD COLUMN IF NOT EXISTS "title" VARCHAR(120);
ALTER TABLE "short_links" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "short_links" ADD COLUMN IF NOT EXISTS "is_favorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "short_links" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "short_links" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "short_links" ADD COLUMN IF NOT EXISTS "qr_style" JSONB;

DROP POLICY IF EXISTS "short_links_delete_public" ON "short_links";
CREATE POLICY "short_links_delete_public"
  ON "short_links" FOR DELETE
  USING (true);
