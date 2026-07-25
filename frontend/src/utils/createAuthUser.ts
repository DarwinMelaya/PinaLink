import type { UserRole } from "./authApi";

export type CreatedAuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
};

/**
 * Creates Auth user + profile via Vite DB middleware.
 * Skips /auth/v1/signup so confirmation emails (and rate limits) never fire.
 */
export async function createAuthUserWithoutEmail(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}): Promise<CreatedAuthUser> {
  const response = await fetch("/api/auth/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    user?: CreatedAuthUser;
    error?: string;
  };

  if (!response.ok || !payload.user) {
    throw new Error(
      payload.error ??
        "Could not create user. Is the Vite dev server running?",
    );
  }

  return payload.user;
}
