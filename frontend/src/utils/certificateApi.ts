import supabase from "./supabaseClient";
import {
  generateCertificateNumber,
  normalizeCertificateNumber,
  type CertificateTemplateId,
} from "./certificate";

export type CertificateStatus = "VALID" | "REVOKED";

export type CertificateRow = {
  id: string;
  certificate_number: string;
  participant_name: string;
  participant_email: string | null;
  training_event_name: string;
  date_issued: string;
  issuing_organization: string;
  status: CertificateStatus;
  template: CertificateTemplateId;
  verify_count: number;
  revoked_at: string | null;
  revoke_reason: string | null;
  user_id: string;
  created_at: string;
};

export type CreateCertificateInput = {
  userId: string;
  participantName: string;
  participantEmail?: string | null;
  trainingEventName: string;
  dateIssued: string;
  issuingOrganization: string;
  template: CertificateTemplateId;
  /** Optional custom number; auto-generated if omitted/blank */
  certificateNumber?: string | null;
};

const MAX_NUMBER_RETRIES = 5;

function normalizeRow(data: CertificateRow): CertificateRow {
  return {
    ...data,
    participant_email: data.participant_email ?? null,
    verify_count: data.verify_count ?? 0,
    revoked_at: data.revoked_at ?? null,
    revoke_reason: data.revoke_reason ?? null,
    status: data.status ?? "VALID",
    template: data.template ?? "TRAINING",
  };
}

export async function createCertificate(
  input: CreateCertificateInput,
): Promise<CertificateRow> {
  const custom = input.certificateNumber
    ? normalizeCertificateNumber(input.certificateNumber)
    : null;

  if (input.certificateNumber?.trim() && !custom) {
    throw new Error(
      "Certificate number must be 3–64 chars: letters, numbers, _ or -.",
    );
  }

  let lastError: Error | null = null;
  const attempts = custom ? 1 : MAX_NUMBER_RETRIES;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const certificateNumber = custom ?? generateCertificateNumber();
    // ASSUMPTION: @default(uuid()) is Prisma Client-only — Supabase insert must send id
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        id: crypto.randomUUID(),
        certificate_number: certificateNumber,
        participant_name: input.participantName.trim(),
        participant_email: input.participantEmail?.trim() || null,
        training_event_name: input.trainingEventName.trim(),
        date_issued: input.dateIssued,
        issuing_organization: input.issuingOrganization.trim(),
        template: input.template,
        status: "VALID",
        user_id: input.userId,
      })
      .select()
      .single();

    if (!error && data) {
      return normalizeRow(data as CertificateRow);
    }

    if (error?.code === "23505") {
      lastError = new Error(
        custom
          ? "That certificate number is already taken."
          : error.message,
      );
      if (custom) break;
      continue;
    }

    throw new Error(error?.message ?? "Failed to create certificate");
  }

  throw lastError ?? new Error("Could not allocate unique certificate number");
}

export async function listCertificatesByUser(
  userId: string,
): Promise<CertificateRow[]> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as CertificateRow[]) ?? []).map(normalizeRow);
}

export async function getCertificateByNumber(
  certificateNumber: string,
): Promise<CertificateRow | null> {
  const normalized = normalizeCertificateNumber(certificateNumber);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("certificate_number", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeRow(data as CertificateRow) : null;
}

export async function searchCertificatesByName(
  nameQuery: string,
): Promise<CertificateRow[]> {
  const q = nameQuery.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .ilike("participant_name", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return ((data as CertificateRow[]) ?? []).map(normalizeRow);
}

export async function revokeCertificate(
  id: string,
  reason?: string | null,
): Promise<CertificateRow> {
  const { data, error } = await supabase
    .from("certificates")
    .update({
      status: "REVOKED",
      revoked_at: new Date().toISOString(),
      revoke_reason: reason?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRow(data as CertificateRow);
}

export async function deleteCertificate(id: string): Promise<void> {
  const { error } = await supabase.from("certificates").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function incrementVerifyCount(
  id: string,
  current: number,
): Promise<void> {
  const { error } = await supabase
    .from("certificates")
    .update({ verify_count: current + 1 })
    .eq("id", id);

  if (error) {
    console.error("Failed to increment verify count:", error.message);
  }
}
