/** Supabase redirects OAuth failures back with `?error=...&error_description=...`. */
export function oauthErrorFromSearch(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("error")) return null;
  const description = params.get("error_description");
  if (description) return description.replace(/\+/g, " ");
  return params.get("error");
}
