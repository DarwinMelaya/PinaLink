/**
 * Marks a just-created Auth user as email-confirmed via Vite middleware.
 * Uses DIRECT_URL on the server — any email can sign in without inbox verify.
 */
export async function autoConfirmAuthEmail(userId: string): Promise<void> {
  const response = await fetch("/api/auth/auto-confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.error ??
        "Could not skip email verification. Is the Vite dev server running?",
    );
  }
}
