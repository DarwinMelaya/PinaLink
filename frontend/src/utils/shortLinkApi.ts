import supabase from "./supabaseClient";
import { generateShortCode } from "./shortLink";

export type ShortLinkRow = {
  id: string;
  code: string;
  original_url: string;
  user_id: string | null;
  created_at: string;
  click_count: number;
};

const MAX_CODE_RETRIES = 5;

export async function createShortLink(
  originalUrl: string,
  userId: string,
): Promise<ShortLinkRow> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const code = generateShortCode();
    // ASSUMPTION: @default(uuid()) is Prisma Client-only — Supabase insert must send id
    const { data, error } = await supabase
      .from("short_links")
      .insert({
        id: crypto.randomUUID(),
        code,
        original_url: originalUrl,
        user_id: userId,
      })
      .select()
      .single();

    if (!error && data) {
      return data as ShortLinkRow;
    }

    // Unique violation — try another code
    if (error?.code === "23505") {
      lastError = new Error(error.message);
      continue;
    }

    throw new Error(error?.message ?? "Failed to create short link");
  }

  throw lastError ?? new Error("Could not allocate unique short code");
}

export async function listShortLinksByUser(
  userId: string,
): Promise<ShortLinkRow[]> {
  const { data, error } = await supabase
    .from("short_links")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ShortLinkRow[]) ?? [];
}

export async function getShortLinkByCode(code: string): Promise<ShortLinkRow | null> {
  const { data, error } = await supabase
    .from("short_links")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ShortLinkRow | null;
}

export async function incrementClickCount(id: string, current: number): Promise<void> {
  const { error } = await supabase
    .from("short_links")
    .update({ click_count: current + 1 })
    .eq("id", id);

  if (error) {
    console.error("Failed to increment click count:", error.message);
  }
}
