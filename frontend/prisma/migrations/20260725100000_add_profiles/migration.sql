-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_email_key" ON "profiles"("email");

-- Anon key needs these for SPA register/login
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON "profiles";
CREATE POLICY "profiles_select_public"
  ON "profiles" FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_public" ON "profiles";
CREATE POLICY "profiles_insert_public"
  ON "profiles" FOR INSERT
  WITH CHECK (true);
