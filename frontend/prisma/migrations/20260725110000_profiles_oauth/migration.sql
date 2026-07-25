-- Allow OAuth users without a local password hash
ALTER TABLE "profiles" ALTER COLUMN "password_hash" DROP NOT NULL;

DROP POLICY IF EXISTS "profiles_update_public" ON "profiles";
CREATE POLICY "profiles_update_public"
  ON "profiles" FOR UPDATE
  USING (true)
  WITH CHECK (true);
