import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type CreateBody = {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
};

type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  created_at: string;
};

/**
 * Vercel serverless twin of the Vite create-user middleware.
 * Uses the service role so accounts are email-confirmed without inbox mail.
 *
 * Required env on Vercel:
 * - VITE_SUPABASE_URL (or SUPABASE_URL)
 * - SUPABASE_SERVICE_ROLE_KEY
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({
      error:
        "Server auth missing. Set SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL on Vercel.",
    });
    return;
  }

  let body: CreateBody = {};
  try {
    body =
      typeof req.body === "string"
        ? (JSON.parse(req.body) as CreateBody)
        : ((req.body as CreateBody | null) ?? {});
  } catch {
    res.status(400).json({ error: "Invalid JSON body." });
    return;
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const name = body.name?.trim() ?? "";
  const role = body.role === "ADMIN" ? "ADMIN" : "USER";

  if (!email.includes("@") || !name || password.length < 8) {
    res.status(400).json({
      error: "Valid name, email, and password (8+) are required.",
    });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

  if (createError || !created.user) {
    const message = createError?.message ?? "Could not create user.";
    const status = /already|registered|exists/i.test(message) ? 409 : 500;
    res.status(status).json({ error: message });
    return;
  }

  const user = created.user;
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        name,
        password_hash: null,
        role,
      },
      { onConflict: "id" },
    )
    .select("id, email, name, role, created_at")
    .single();

  if (profileError || !profile) {
    res.status(500).json({
      error: profileError?.message ?? "Could not create profile.",
    });
    return;
  }

  const payload: PublicUser = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role === "ADMIN" ? "ADMIN" : "USER",
    created_at: profile.created_at,
  };

  res.status(200).json({ user: payload });
}
