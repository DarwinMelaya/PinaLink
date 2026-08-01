import supabase from "./supabaseClient";
import { buildShortUrl, generateShortCode } from "./shortLink";
import type { QrStyle } from "./qrStyle";

export type ShortLinkRow = {
  id: string;
  code: string;
  original_url: string;
  user_id: string | null;
  created_at: string;
  click_count: number;
  title: string | null;
  notes: string | null;
  is_favorite: boolean;
  is_active: boolean;
  expires_at: string | null;
  qr_style: QrStyle | Record<string, unknown> | null;
};

export type ShortLinkUpdate = {
  code?: string;
  original_url?: string;
  title?: string | null;
  notes?: string | null;
  is_favorite?: boolean;
  is_active?: boolean;
  expires_at?: string | null;
  qr_style?: QrStyle | null;
};

const MAX_CODE_RETRIES = 5;

function normalizeRow(data: ShortLinkRow): ShortLinkRow {
  return {
    ...data,
    title: data.title ?? null,
    notes: data.notes ?? null,
    is_favorite: data.is_favorite ?? false,
    is_active: data.is_active ?? true,
    expires_at: data.expires_at ?? null,
    qr_style: data.qr_style ?? null,
  };
}

export async function createShortLink(
  originalUrl: string,
  userId: string,
  opts?: { title?: string | null },
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
        title: opts?.title?.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      return normalizeRow(data as ShortLinkRow);
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

  return ((data as ShortLinkRow[]) ?? []).map(normalizeRow);
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

  return data ? normalizeRow(data as ShortLinkRow) : null;
}

export async function updateShortLink(
  id: string,
  patch: ShortLinkUpdate,
): Promise<ShortLinkRow> {
  const { data, error } = await supabase
    .from("short_links")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That short code is already taken.");
    }
    throw new Error(error.message);
  }

  return normalizeRow(data as ShortLinkRow);
}

export async function deleteShortLink(id: string): Promise<void> {
  const { error } = await supabase.from("short_links").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
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

/** Clone destination + metadata; new code and zero clicks. */
export async function duplicateShortLink(
  source: ShortLinkRow,
  userId: string,
): Promise<ShortLinkRow> {
  const created = await createShortLink(source.original_url, userId);

  const title =
    source.title && source.title.trim()
      ? `${source.title.trim()} (copy)`
      : null;

  return updateShortLink(created.id, {
    title,
    notes: source.notes,
    is_favorite: false,
    is_active: true,
    expires_at: source.expires_at,
    qr_style: (source.qr_style as QrStyle | null) ?? null,
  });
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Download filtered short links as CSV. */
export function exportShortLinksCsv(rows: ShortLinkRow[]): void {
  const header = [
    "code",
    "short_url",
    "title",
    "destination",
    "clicks",
    "favorite",
    "active",
    "expires_at",
    "created_at",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        csvEscape(row.code),
        csvEscape(buildShortUrl(row.code)),
        csvEscape(row.title ?? ""),
        csvEscape(row.original_url),
        String(row.click_count ?? 0),
        row.is_favorite ? "true" : "false",
        row.is_active ? "true" : "false",
        csvEscape(row.expires_at ?? ""),
        csvEscape(row.created_at),
      ].join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pinalink-links-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
