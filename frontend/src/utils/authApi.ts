import type { User } from "@supabase/supabase-js";
import supabase from "./supabaseClient";

export type UserRole = "USER" | "ADMIN";

export type ProfileRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  role: UserRole;
  created_at: string;
};

export type PublicProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};

const SESSION_KEY = "pinalink_session";
const PENDING_ROLE_KEY = "pinalink_pending_role";

function toPublicProfile(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
  };
}

export function saveSession(profile: PublicProfile): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

export function getSession(): PublicProfile | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicProfile;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function homePathForRole(role: UserRole): string {
  return role === "ADMIN" ? "/admin/dashboard" : "/home";
}

function parseRole(value: unknown): UserRole {
  return value === "ADMIN" ? "ADMIN" : "USER";
}

async function findProfile(
  userId: string,
  email: string,
): Promise<ProfileRow | null> {
  const { data: byId, error: idError } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at, password_hash")
    .eq("id", userId)
    .maybeSingle();

  if (idError) {
    throw new Error(idError.message);
  }
  if (byId) {
    return byId as ProfileRow;
  }

  const { data: byEmail, error: emailError } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (emailError) {
    throw new Error(emailError.message);
  }

  return (byEmail as ProfileRow | null) ?? null;
}

async function upsertProfileFromAuthUser(
  user: User,
  fallback?: { name?: string; role?: UserRole },
): Promise<PublicProfile> {
  if (!user.email) {
    throw new Error("Account has no email.");
  }

  const email = user.email.trim().toLowerCase();
  const meta = user.user_metadata ?? {};
  const name =
    fallback?.name?.trim() ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    email.split("@")[0];

  const pendingRole = localStorage.getItem(PENDING_ROLE_KEY);
  const role =
    fallback?.role ??
    (pendingRole === "ADMIN" || pendingRole === "USER"
      ? pendingRole
      : parseRole(meta.role));

  const existing = await findProfile(user.id, email);
  if (existing) {
    localStorage.removeItem(PENDING_ROLE_KEY);
    const profile = toPublicProfile(existing);
    saveSession(profile);
    return profile;
  }

  // password_hash null — Supabase Auth owns the password
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email,
      name,
      password_hash: null,
      role,
    })
    .select("id, email, name, role, created_at, password_hash")
    .single();

  if (insertError) {
    // Race / StrictMode double-call / DB trigger already created row
    if (insertError.code === "23505") {
      const raced = await findProfile(user.id, email);
      if (raced) {
        localStorage.removeItem(PENDING_ROLE_KEY);
        const profile = toPublicProfile(raced);
        saveSession(profile);
        return profile;
      }
    }
    throw new Error(insertError.message || "Could not create profile.");
  }

  localStorage.removeItem(PENDING_ROLE_KEY);
  const profile = toPublicProfile(created as ProfileRow);
  saveSession(profile);
  return profile;
}

/** Register with Supabase Auth email/password (no Google Cloud). */
export async function registerProfile(
  input: RegisterInput,
): Promise<PublicProfile> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!name || !email || !input.password) {
    throw new Error("Name, email, and password are required.");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (input.role !== "USER" && input.role !== "ADMIN") {
    throw new Error("Invalid role.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { name, role: input.role },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message || "Registration failed.");
  }

  if (!data.user) {
    throw new Error("Registration failed. No user returned.");
  }

  // Confirm-email ON: session may be null until user clicks mail link
  if (!data.session) {
    throw new Error(
      "Check your email to confirm your account, then sign in.",
    );
  }

  return upsertProfileFromAuthUser(data.user, {
    name,
    role: input.role,
  });
}

/** Sign in with Supabase Auth email/password. */
export async function loginWithEmail(
  input: LoginInput,
): Promise<PublicProfile> {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    throw new Error("Email and password are required.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message || "Sign in failed.");
  }

  if (!data.user) {
    throw new Error("Sign in failed. No user returned.");
  }

  return upsertProfileFromAuthUser(data.user);
}

/**
 * Google OAuth via Supabase Auth.
 * Requires Google provider enabled in Supabase + Google Cloud OAuth client.
 */
export async function signInWithGoogle(role: UserRole = "USER"): Promise<void> {
  localStorage.setItem(PENDING_ROLE_KEY, role);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    localStorage.removeItem(PENDING_ROLE_KEY);
    throw new Error(error.message || "Google sign-in failed.");
  }
}

/** After Google OAuth or email-confirm redirect. */
let authCallbackInflight: Promise<PublicProfile> | null = null;

export async function completeAuthCallback(): Promise<PublicProfile> {
  if (authCallbackInflight) {
    return authCallbackInflight;
  }

  authCallbackInflight = (async () => {
    // PKCE: exchange ?code= if present (ignore if already exchanged)
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    if (!data.session?.user) {
      throw new Error(
        "No active session. Try Google again, or open the confirm link from your email.",
      );
    }
    return upsertProfileFromAuthUser(data.session.user);
  })().finally(() => {
    authCallbackInflight = null;
  });

  return authCallbackInflight;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  clearSession();
}
