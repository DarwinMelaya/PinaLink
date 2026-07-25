-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALID', 'REVOKED');

-- CreateEnum
CREATE TYPE "CertificateTemplate" AS ENUM (
  'SEMINAR',
  'TRAINING',
  'WEBINAR',
  'COMPETITION',
  'RECOGNITION'
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "certificates" (
  "id" TEXT NOT NULL,
  "certificate_number" VARCHAR(64) NOT NULL,
  "participant_name" VARCHAR(200) NOT NULL,
  "participant_email" VARCHAR(255),
  "training_event_name" VARCHAR(240) NOT NULL,
  "date_issued" TIMESTAMP(3) NOT NULL,
  "issuing_organization" VARCHAR(200) NOT NULL,
  "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',
  "template" "CertificateTemplate" NOT NULL DEFAULT 'TRAINING',
  "verify_count" INTEGER NOT NULL DEFAULT 0,
  "revoked_at" TIMESTAMP(3),
  "revoke_reason" TEXT,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "certificates_certificate_number_key"
  ON "certificates"("certificate_number");

CREATE INDEX IF NOT EXISTS "certificates_user_id_idx"
  ON "certificates"("user_id");

CREATE INDEX IF NOT EXISTS "certificates_participant_name_idx"
  ON "certificates"("participant_name");

-- ForeignKey
ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Anon key needs these for SPA insert/select/update (mirror short_links)
ALTER TABLE "certificates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates_select_public"
  ON "certificates" FOR SELECT
  USING (true);

CREATE POLICY "certificates_insert_public"
  ON "certificates" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "certificates_update_public"
  ON "certificates" FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "certificates_delete_public"
  ON "certificates" FOR DELETE
  USING (true);
