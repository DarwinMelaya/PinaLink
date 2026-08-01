import type { UserRole } from "./authApi";

export type CreatedAuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
};

function isApiUnavailable(response: Response, rawText: string): boolean {
  if (response.status === 404 || response.status === 405) return true;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) return true;
  const trimmed = rawText.trimStart();
  return trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");
}

/**
 * Creates Auth user + profile via `/api/auth/create-user`.
 * Local: Vite middleware. Production: Vercel serverless (service role).
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

  const rawText = await response.text();

  if (isApiUnavailable(response, rawText)) {
    throw new Error("CREATE_USER_API_UNAVAILABLE");
  }

  let payload: { user?: CreatedAuthUser; error?: string } = {};
  try {
    payload = JSON.parse(rawText) as { user?: CreatedAuthUser; error?: string };
  } catch {
    throw new Error("CREATE_USER_API_UNAVAILABLE");
  }

  if (!response.ok || !payload.user) {
    throw new Error(payload.error ?? "Could not create user.");
  }

  return payload.user;
}
