import supabase from "./supabaseClient";
import {
  getSession,
  saveSession,
  type UserRole,
} from "./authApi";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
};

export type AdminUserCreateInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type AdminUserUpdateInput = {
  name: string;
  email: string;
  role: UserRole;
};

const PROFILE_SELECT = "id, email, name, role, created_at" as const;

function parseRole(value: unknown): UserRole {
  return value === "ADMIN" ? "ADMIN" : "USER";
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as AdminUserRow[]) ?? []).map((row) => ({
    ...row,
    role: parseRole(row.role),
  }));
}

/**
 * Creates Auth user + profile without leaving the admin signed in.
 * Uses DB create (no /auth/v1/signup) so email rate limits never apply.
 */
export async function createAdminUser(
  input: AdminUserCreateInput,
): Promise<AdminUserRow> {
  const adminProfile = getSession();
  if (!adminProfile || adminProfile.role !== "ADMIN") {
    throw new Error("Admin session required.");
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }
  if (!email.includes("@")) {
    throw new Error("Enter a valid email.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (input.role !== "USER" && input.role !== "ADMIN") {
    throw new Error("Invalid role.");
  }

  const { createAuthUserWithoutEmail } = await import("./createAuthUser");
  const created = await createAuthUserWithoutEmail({
    email,
    password,
    name,
    role: input.role,
  });

  return {
    id: created.id,
    email: created.email,
    name: created.name,
    role: parseRole(created.role),
    created_at: created.created_at,
  };
}

export async function updateAdminUser(
  id: string,
  input: AdminUserUpdateInput,
): Promise<AdminUserRow> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }
  if (input.role !== "USER" && input.role !== "ADMIN") {
    throw new Error("Invalid role.");
  }

  const current = getSession();
  if (current?.id === id && input.role !== "ADMIN") {
    throw new Error("You cannot demote your own admin account.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ name, email, role: input.role })
    .eq("id", id)
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as AdminUserRow;
  if (current?.id === id) {
    saveSession({
      id: row.id,
      email: row.email,
      name: row.name,
      role: parseRole(row.role),
      created_at: row.created_at,
    });
  }

  return { ...row, role: parseRole(row.role) };
}

export async function updateAdminUserRole(
  id: string,
  role: UserRole,
): Promise<AdminUserRow> {
  const current = getSession();
  if (current?.id === id && role !== "ADMIN") {
    throw new Error("You cannot demote your own admin account.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as AdminUserRow;
  return { ...row, role: parseRole(row.role) };
}

/**
 * Deletes the profile row only.
 * ASSUMPTION: Auth user may remain in Supabase Auth (needs Admin API to remove).
 */
export async function deleteAdminUser(id: string): Promise<void> {
  const current = getSession();
  if (current?.id === id) {
    throw new Error("You cannot delete your own account.");
  }

  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
