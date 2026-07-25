import supabase from "./supabaseClient";

export type CertificateBrandingRow = {
  id: string;
  user_id: string;
  logo_data_url: string | null;
  page_title: string | null;
  page_subtitle: string | null;
  accent_color: string | null;
  updated_at: string;
  created_at: string;
};

export type CertificateBrandingInput = {
  logoDataUrl?: string | null;
  pageTitle?: string | null;
  pageSubtitle?: string | null;
  accentColor?: string | null;
};

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

function normalizeRow(data: CertificateBrandingRow): CertificateBrandingRow {
  return {
    ...data,
    logo_data_url: data.logo_data_url ?? null,
    page_title: data.page_title ?? null,
    page_subtitle: data.page_subtitle ?? null,
    accent_color: data.accent_color ?? null,
  };
}

export async function getCertificateBrandingByUserId(
  userId: string,
): Promise<CertificateBrandingRow | null> {
  const { data, error } = await supabase
    .from("certificate_branding")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeRow(data as CertificateBrandingRow) : null;
}

export async function upsertCertificateBranding(
  userId: string,
  input: CertificateBrandingInput,
): Promise<CertificateBrandingRow> {
  const accent = input.accentColor?.trim() || null;
  if (accent && !HEX_COLOR.test(accent)) {
    throw new Error("Accent color must be a hex like #00d4c5.");
  }

  const payload = {
    logo_data_url: input.logoDataUrl ?? null,
    page_title: input.pageTitle?.trim() || null,
    page_subtitle: input.pageSubtitle?.trim() || null,
    accent_color: accent,
    updated_at: new Date().toISOString(),
  };

  const existing = await getCertificateBrandingByUserId(userId);

  if (existing) {
    const { data, error } = await supabase
      .from("certificate_branding")
      .update(payload)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return normalizeRow(data as CertificateBrandingRow);
  }

  const { data, error } = await supabase
    .from("certificate_branding")
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      ...payload,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRow(data as CertificateBrandingRow);
}

/** Max raw file size before base64 (~400KB decoded → ~550KB data URL). */
export const MAX_BRANDING_LOGO_BYTES = 400 * 1024;

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Upload an image file (PNG, JPG, WebP, or SVG)."));
      return;
    }
    if (file.size > MAX_BRANDING_LOGO_BYTES) {
      reject(new Error("Logo must be 400KB or smaller."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read image."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}
